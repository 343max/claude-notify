export function parseArgs(): { configPath?: string } {
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
