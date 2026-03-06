import process from "node:process"

export function parseArgs(): {configPath?: string; sendExample?: boolean} {
  const args = process.argv.slice(2)
  const result: {configPath?: string; sendExample?: boolean} = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--config" && i + 1 < args.length) {
      result.configPath = args[i + 1]
      i++
    } else if (arg.startsWith("--config=")) {
      result.configPath = arg.slice("--config=".length)
    } else if (arg === "--send-example-notification") {
      result.sendExample = true
    } else if (arg === "--help" || arg === "-h") {
      console.log([
        "Usage: claude-notify [options]",
        "",
        "Options:",
        "  --config <path>              Path to configuration file (default: ~/.config/claude-notify.json)",
        "  --send-example-notification  Send a test notification to all channels and exit",
        "  --help, -h                   Show this help message",
        "",
        "Input: JSON data from stdin",
        "",
      ].join("\n"))
      process.exit(0)
    }
  }

  return result
}
