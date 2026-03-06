import {Buffer} from "node:buffer"
import {type Config} from "./schemas/config"

export async function sendRemoteNotification(
  config: Config,
  title: string,
  message: string,
  clickUrl?: string,
): Promise<void> {
  const {NTFY_URL, NTFY_TOPIC} = config

  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
    Title: title,
  }

  if (clickUrl) {
    headers.Click = clickUrl
  }

  if (config.NTFY_TOKEN) {
    headers.Authorization = `Bearer ${config.NTFY_TOKEN}`
  } else if (config.NTFY_USERNAME && config.NTFY_PASSWORD) {
    headers.Authorization
      = `Basic ${Buffer.from(`${config.NTFY_USERNAME}:${config.NTFY_PASSWORD}`).toString("base64")}`
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
    console.error("Error sending remote notification:", error instanceof Error ? error.message : "Unknown error")
  }
}
