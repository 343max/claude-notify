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

const ConfigSchema = z.object({
  PUSHOVER_API_KEY: z
    .string()
    .min(1, "PUSHOVER_API_KEY cannot be empty")
    .regex(/^[a-zA-Z0-9]+$/, "PUSHOVER_API_KEY must contain only alphanumeric characters"),
  PUSHOVER_USER_KEY: z
    .string()
    .min(1, "PUSHOVER_USER_KEY cannot be empty")
    .regex(/^[a-zA-Z0-9]+$/, "PUSHOVER_USER_KEY must contain only alphanumeric characters"),
  BUSY_TIME: z.number().min(1, "BUSY_TIME must be at least 1 second").optional().default(20),
  CODE_SERVER_URL: z.string().optional(),
  CODE_SERVER_URL_TITLE: z.string().optional(),
  NOTIFICATION_TTL_MINUTES: z.number().min(1, "NOTIFICATION_TTL_MINUTES must be at least 1").optional(),
  NOTIFICATION_SOUND: z
    .enum([
      "pushover",
      "bike",
      "bugle",
      "cashregister",
      "classical",
      "cosmic",
      "falling",
      "gamelan",
      "incoming",
      "intermission",
      "magic",
      "mechanical",
      "pianobar",
      "siren",
      "spacealarm",
      "tugboat",
      "alien",
      "climb",
      "persistent",
      "echo",
      "updown",
      "vibrate",
      "none",
    ])
    .optional()
    .default("mechanical"),
})

type Config = z.infer<typeof ConfigSchema>

interface PushoverRequest {
  token: string
  user: string
  message: string
  title: string
  url?: string
  url_title?: string
  ttl?: number
  sound?: string
}

interface PushoverResponse {
  status: number
  request: string
  errors?: string[]
}

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
        "Please create this file with your Pushover API credentials:",
        "",
        "Usage: claude-notify [--config <path>]",
        "",
        "Example configuration:",
        "{",
        '  "PUSHOVER_API_KEY": "your_app_token_here",',
        '  "PUSHOVER_USER_KEY": "your_user_key_here",',
        '  "BUSY_TIME": 20,',
        '  "CODE_SERVER_URL": "https://your-code-server:8443",',
        '  "CODE_SERVER_URL_TITLE": "Open in Code Server",',
        '  "NOTIFICATION_TTL_MINUTES": 5,',
        '  "NOTIFICATION_SOUND": "mechanical"',
        "}",
        "",
        "Get your credentials from: https://pushover.net/",
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
          '  "PUSHOVER_API_KEY": "your_app_token_here",',
          '  "PUSHOVER_USER_KEY": "your_user_key_here",',
          '  "BUSY_TIME": 20,',
          '  "CODE_SERVER_URL": "https://your-code-server:8443",',
          '  "CODE_SERVER_URL_TITLE": "Open in Code Server",',
          '  "NOTIFICATION_TTL_MINUTES": 5,',
          '  "NOTIFICATION_SOUND": "mechanical"',
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
          '  "PUSHOVER_API_KEY": "your_app_token_here",',
          '  "PUSHOVER_USER_KEY": "your_user_key_here",',
          '  "BUSY_TIME": 20,',
          '  "CODE_SERVER_URL": "https://your-code-server:8443",',
          '  "CODE_SERVER_URL_TITLE": "Open in Code Server",',
          '  "NOTIFICATION_TTL_MINUTES": 5,',
          '  "NOTIFICATION_SOUND": "mechanical"',
          "}",
          "",
          "Requirements:",
          "- PUSHOVER_API_KEY: Required, must be alphanumeric (app token)",
          "- PUSHOVER_USER_KEY: Required, must be alphanumeric (user key)",
          "- BUSY_TIME: Optional, minimum delay in seconds (default: 20)",
          "- CODE_SERVER_URL: Optional, base URL to open the project (https:// or vscode://)",
          "- CODE_SERVER_URL_TITLE: Optional, label for the URL link in the notification",
          "- NOTIFICATION_TTL_MINUTES: Optional, auto-delete notification after this many minutes",
          "- NOTIFICATION_SOUND: Optional, notification sound (default: mechanical). See https://pushover.net/api#sounds",
          "",
          "Get your credentials from: https://pushover.net/",
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

async function sendPushoverNotification(config: Config, data: ClaudeNotificationInput): Promise<void> {
  const { PUSHOVER_API_KEY, PUSHOVER_USER_KEY, BUSY_TIME, NOTIFICATION_TTL_MINUTES } = config

  console.error(data.transcript_path)

  const lastUserMessage = await getLastUserMessage(data.transcript_path)

  console.error("Last user message:", lastUserMessage)

  if (!lastUserMessage) {
    return
  }

  const messageTimestamp = new Date(lastUserMessage.timestamp)
  const currentTime = new Date()
  const timeDifferenceSeconds = (currentTime.getTime() - messageTimestamp.getTime()) / 1000

  console.error(`Time since last user message: ${Math.round(timeDifferenceSeconds)}s`)

  if (timeDifferenceSeconds < BUSY_TIME) {
    return
  }

  const projectName = basename(lastUserMessage.cwd)
  const userMessageContent = lastUserMessage.content

  const title = `Claude Code - ${projectName}`
  const prefix = `finished after ${Math.round(timeDifferenceSeconds)}s: `
  const maxContent = 1024 - prefix.length
  const truncated =
    userMessageContent.length > maxContent ? userMessageContent.slice(0, maxContent - 1) + "…" : userMessageContent
  const message = prefix + truncated

  const url = config.CODE_SERVER_URL ? `${config.CODE_SERVER_URL}/?folder=${lastUserMessage.cwd}` : undefined

  const pushoverData: PushoverRequest = {
    token: PUSHOVER_API_KEY,
    user: PUSHOVER_USER_KEY,
    message,
    title,
    ...(url && { url }),
    ...(url && config.CODE_SERVER_URL_TITLE && { url_title: config.CODE_SERVER_URL_TITLE }),
    ...(NOTIFICATION_TTL_MINUTES && { ttl: NOTIFICATION_TTL_MINUTES * 60 }),
    sound: config.NOTIFICATION_SOUND,
  }

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushoverData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const result = (await response.json()) as PushoverResponse

    if (result.status !== 1) {
      throw new Error(`Pushover API error: ${result.errors?.join(", ") || "Unknown error"}`)
    }
  } catch (error) {
    console.error("Error sending notification:", error instanceof Error ? error.message : "Unknown error")
  }
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
    const inputData = InputSchema.parse(rawInput)

    await sendPushoverNotification(config, inputData)
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

main()
