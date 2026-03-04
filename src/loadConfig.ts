import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { ConfigSchema, type Config } from "./schemas/config"

export function loadConfig(customConfigPath?: string): Config {
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
