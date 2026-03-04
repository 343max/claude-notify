#!/usr/bin/env bun

import { readFileSync, existsSync } from "fs"
import { join, basename } from "path"
import { homedir } from "os"
import { z } from "zod"
import { TranscriptRecordSchema } from "./src/schemas/transcript"
import { getLastUserMessageContent } from "./src/getLastUserMessageContent"

const InputSchema = z.object({
  session_id: z.string(),
  transcript_path: z.string(),
  cwd: z.string(),
  permission_mode: z.string().optional(),
  hook_event_name: z.string(),
  stop_hook_active: z.boolean(),
  last_assistant_message: z.string().optional(),
})

type ClaudeNotificationInput = z.infer<typeof InputSchema>

const ConfigSchema = z
  .object({
    NTFY_URL: z.string().min(1, "NTFY_URL cannot be empty").url("NTFY_URL must be a valid URL"),
    NTFY_TOPIC: z.string().min(1, "NTFY_TOPIC cannot be empty"),
    NTFY_TOKEN: z.string().optional(),
    NTFY_USERNAME: z.string().optional(),
    NTFY_PASSWORD: z.string().optional(),
    BUSY_TIME: z.number().min(1, "BUSY_TIME must be at least 1 second").optional().default(20),
    CLICK_URL_PREFIX: z.string().optional(),
  })
  .refine((data) => !data.NTFY_USERNAME || !!data.NTFY_PASSWORD, {
    message: "NTFY_PASSWORD is required when NTFY_USERNAME is set",
    path: ["NTFY_PASSWORD"],
  })

type Config = z.infer<typeof ConfigSchema>

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString()
}

function parseLine(line: string): { content: string; cwd: string; timestamp: string } | null {
  const parsed = TranscriptRecordSchema.parse(JSON.parse(line))

  if (parsed.type !== "user" || parsed.message.role !== "user") {
    return null
  }

  const content = getLastUserMessageContent(parsed.message.content)
  if (content === null) {
    return null
  } else {
    return {
      content,
      cwd: parsed.cwd,
      timestamp: parsed.timestamp,
    }
  }
}

async function getLastUserMessage(
  transcriptPath: string
): Promise<{ content: string; cwd: string; timestamp: string } | null> {
  try {
    const content = readFileSync(transcriptPath.replace(/^~/, process.env.HOME || ""), "utf8")
    const lines = content.trim().split("\n")

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const userMessage = parseLine(line)
        if (userMessage) {
          return userMessage
        }
      } catch (parseError) {
        console.error(`Failed to parse line ${i}:`, parseError instanceof Error ? parseError.message : "Unknown error")
        console.error("Line content:", line)
        process.exit(1)
      }
    }

    return null
  } catch (error) {
    throw new Error(`Failed to read transcript: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function loadConfig(customConfigPath?: string): Config {
  const configPath = customConfigPath || join(homedir(), ".config", "claude-notify.json")

  if (!existsSync(configPath)) {
    console.error(
      [
        `❌ Configuration file not found at ${configPath}`,
        "",
        "Please create this file with your ntfy configuration:",
        "",
        "Usage: claude-notify [--config <path>]",
        "",
        "Example configuration:",
        "{",
        '  "NTFY_URL": "https://ntfy.sh",',
        '  "NTFY_TOPIC": "my-claude-notifications",',
        '  "BUSY_TIME": 20,',
        '  "CLICK_URL_PREFIX": "https://your-code-server:8443/?folder=",',
        '  "CLICK_URL_TITLE": "Open in Code Server"',
        "}",
        "",
        "Get started with ntfy at: https://ntfy.sh/",
        "",
      ].join("\n")
    )
    process.exit(1)
  }

  try {
    const configContent = readFileSync(configPath, "utf8")

    let parsedConfig: unknown
    try {
      parsedConfig = JSON.parse(configContent)
    } catch (parseError) {
      console.error(
        [
          "❌ Invalid JSON in configuration file",
          "",
          "The configuration file contains invalid JSON syntax.",
          `Please check your ${configPath} file and ensure it is valid JSON.`,
          "",
          "Example valid configuration:",
          "{",
          '  "NTFY_URL": "https://ntfy.sh",',
          '  "NTFY_TOPIC": "my-claude-notifications",',
          '  "BUSY_TIME": 20,',
          '  "CLICK_URL_PREFIX": "https://your-code-server:8443/?folder=",',
          '  "CLICK_URL_TITLE": "Open in Code Server"',
          "}",
          "",
        ].join("\n")
      )
      process.exit(1)
    }

    const validationResult = ConfigSchema.safeParse(parsedConfig)

    if (!validationResult.success) {
      console.error(
        [
          "❌ Invalid configuration",
          "",
          "The following configuration errors were found:",
          ...validationResult.error.errors.map(
            (error, index) => `  ${index + 1}. ${error.path.join(".")}: ${error.message}`
          ),
          "",
          "Expected configuration format:",
          "{",
          '  "NTFY_URL": "https://ntfy.sh",',
          '  "NTFY_TOPIC": "my-claude-notifications",',
          '  "NTFY_TOKEN": "your-bearer-token",',
          '  "BUSY_TIME": 20,',
          '  "CLICK_URL_PREFIX": "https://your-code-server:8443/?folder=",',
          '  "CLICK_URL_TITLE": "Open in Code Server"',
          "}",
          "",
          "Requirements:",
          "- NTFY_URL: Required, must be a valid URL (e.g. https://ntfy.sh or your self-hosted instance)",
          "- NTFY_TOPIC: Required, the topic name to publish notifications to",
          "- NTFY_TOKEN: Optional, Bearer token for authorization",
          "- NTFY_USERNAME / NTFY_PASSWORD: Optional, Basic auth credentials (both required if used)",
          "- BUSY_TIME: Optional, minimum delay in seconds before notifying (default: 20)",
          "- CLICK_URL_PREFIX: Optional, URL prefix for a tappable link in the notification (cwd is appended)",
          "- CLICK_URL_TITLE: Optional, label for the link in the notification",
          "",
          "Get started with ntfy at: https://ntfy.sh/",
          "",
        ].join("\n")
      )
      process.exit(1)
    }

    return validationResult.data
  } catch (error) {
    console.error("❌ Error reading configuration file:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

async function sendNtfyNotification(config: Config, data: ClaudeNotificationInput): Promise<void> {
  const { NTFY_URL, NTFY_TOPIC, BUSY_TIME } = config

  const lastUserMessage = await getLastUserMessage(data.transcript_path)

  if (!lastUserMessage) {
    return
  }

  const messageTimestamp = new Date(lastUserMessage.timestamp)
  const currentTime = new Date()
  const timeDifferenceSeconds = (currentTime.getTime() - messageTimestamp.getTime()) / 1000

  if (timeDifferenceSeconds < BUSY_TIME) {
    return
  }

  const projectName = basename(lastUserMessage.cwd)
  const userMessageContent = lastUserMessage.content

  const title = `Claude Code - ${projectName}`
  const prefix = `finished after ${Math.round(timeDifferenceSeconds)}s: `
  const maxContent = 4096 - prefix.length
  const truncated =
    userMessageContent.length > maxContent ? userMessageContent.slice(0, maxContent - 1) + "…" : userMessageContent
  const message = prefix + truncated

  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
    Title: title,
  }

  if (config.CLICK_URL_PREFIX) {
    headers["Click"] = `${config.CLICK_URL_PREFIX}${lastUserMessage.cwd}`
  }

  if (config.NTFY_TOKEN) {
    headers["Authorization"] = `Bearer ${config.NTFY_TOKEN}`
  } else if (config.NTFY_USERNAME && config.NTFY_PASSWORD) {
    headers["Authorization"] =
      `Basic ${Buffer.from(`${config.NTFY_USERNAME}:${config.NTFY_PASSWORD}`).toString("base64")}`
  }

  try {
    const response = await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
      method: "POST",
      headers,
      body: message,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }
  } catch (error) {
    console.error("Error sending notification:", error instanceof Error ? error.message : "Unknown error")
  }
}

function validateInput(input: unknown): ClaudeNotificationInput {
  return InputSchema.parse(input)
}

function parseArgs(): { configPath?: string } {
  const args = process.argv.slice(2)
  const result: { configPath?: string } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--config" && i + 1 < args.length) {
      result.configPath = args[i + 1]
      i++
    } else if (arg.startsWith("--config=")) {
      result.configPath = arg.substring("--config=".length)
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: claude-notify [options]",
          "",
          "Options:",
          "  --config <path>    Path to configuration file (default: ~/.config/claude-notify.json)",
          "  --help, -h         Show this help message",
          "",
          "Input: JSON data from stdin",
          "",
        ].join("\n")
      )
      process.exit(0)
    }
  }

  return result
}

async function main(): Promise<void> {
  try {
    const { configPath } = parseArgs()
    const config = loadConfig(configPath)
    const stdinContent = await readStdin()

    if (!stdinContent.trim()) {
      console.error("No input received from stdin")
      process.exit(1)
    }

    const rawInput = JSON.parse(stdinContent)
    const inputData = validateInput(rawInput)

    await sendNtfyNotification(config, inputData)
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

main()
