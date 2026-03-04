import { basename } from "path"
import { type Config } from "./schemas/config"
import { type ClaudeNotificationInput } from "./schemas/input"
import { getLastUserMessage } from "./getLastUserMessage"

export async function sendNtfyNotification(config: Config, data: ClaudeNotificationInput): Promise<void> {
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

  const titlePrefix =
    data.hook_event_name === "Stop"
      ? "Task completed"
      : data.hook_event_name === "PermissionRequest"
        ? "Permission Request"
        : "Claude Code"
  const title = `${titlePrefix} - ${projectName}`
  const message =
    userMessageContent.length > 4096 ? userMessageContent.slice(0, 4095) + "…" : userMessageContent

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
