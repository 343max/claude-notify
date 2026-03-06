#!/usr/bin/env bun

import process from "node:process"
import {Buffer} from "node:buffer"
import {basename} from "node:path"
import {InputSchema} from "./src/schemas/input"
import {formatPermissionBody} from "./src/formatPermissionBody"
import {loadConfig} from "./src/loadConfig"
import {parseArgs} from "./src/parseArgs"
import {getLastUserMessage} from "./src/getLastUserMessage"
import {getMacIdleTime} from "./src/getMacIdleTime"
import {sendLocalNotification} from "./src/sendLocalNotification"
import {sendRemoteNotification} from "./src/sendRemoteNotification"

function buildClickUrl(template: string, cwd: string): string {
  return template.includes("{cwd}") ? template.replace("{cwd}", cwd) : `${template}${cwd}`
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Uint8Array)
  }

  return Buffer.concat(chunks).toString()
}

async function sendExampleNotification(config: ReturnType<typeof loadConfig>): Promise<void> {
  const cwd = process.cwd()
  const title = "Example Notification - claude-notify"
  const body = `Test from ${cwd}`

  const localClickUrl = config.LOCAL_CLICK_URL ? buildClickUrl(config.LOCAL_CLICK_URL, cwd) : undefined
  const remoteClickUrl = config.REMOTE_CLICK_URL
    ? buildClickUrl(config.REMOTE_CLICK_URL, cwd)
    : (config.CLICK_URL_PREFIX
      ? buildClickUrl(config.CLICK_URL_PREFIX, cwd)
      : undefined)

  console.log("Sending local notification…")
  await sendLocalNotification(title, body, localClickUrl)

  console.log("Sending remote notification…")
  await sendRemoteNotification(config, title, body, remoteClickUrl)

  console.log("Done.")
}

async function main(): Promise<void> {
  try {
    const {configPath, sendExample} = parseArgs()
    const config = loadConfig(configPath)

    if (sendExample) {
      await sendExampleNotification(config)
      return
    }

    const stdinContent = await readStdin()

    if (!stdinContent.trim()) {
      console.error("No input received from stdin")
      process.exit(1)
    }

    const rawInput = JSON.parse(stdinContent) as unknown
    const inputData = InputSchema.parse(rawInput)

    const lastUserMessage = await getLastUserMessage(inputData.transcript_path)
    if (!lastUserMessage) {
      return
    }

    const timeDifferenceSeconds = (Date.now() - new Date(lastUserMessage.timestamp).getTime()) / 1000
    if (timeDifferenceSeconds < config.BUSY_TIME) {
      return
    }

    const projectName = basename(lastUserMessage.cwd)
    const titlePrefix
      = inputData.hook_event_name === "Stop"
        ? "Task completed"
        : (inputData.hook_event_name === "PermissionRequest"
          ? "Permission Request"
          : "Claude Code")
    const title = `${titlePrefix} - ${projectName}`
    const body
      = inputData.hook_event_name === "PermissionRequest" && inputData.tool_name && inputData.tool_input
        ? formatPermissionBody(inputData.tool_name, inputData.tool_input)
        : (lastUserMessage.content.length > 4096
          ? lastUserMessage.content.slice(0, 4095) + "…"
          : lastUserMessage.content)

    const localClickUrl = config.LOCAL_CLICK_URL
      ? buildClickUrl(config.LOCAL_CLICK_URL, lastUserMessage.cwd)
      : undefined

    await sendLocalNotification(title, body, localClickUrl)

    const remoteClickUrl = config.REMOTE_CLICK_URL
      ? buildClickUrl(config.REMOTE_CLICK_URL, lastUserMessage.cwd)
      : (config.CLICK_URL_PREFIX
        ? buildClickUrl(config.CLICK_URL_PREFIX, lastUserMessage.cwd)
        : undefined)

    if (config.AWAY_FROM_KEYBOARD_TIMEOUT === null || (await getMacIdleTime()) > config.AWAY_FROM_KEYBOARD_TIMEOUT) {
      await sendRemoteNotification(config, title, body, remoteClickUrl)
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

await main()
