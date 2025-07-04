# Claude Notify

A command-line notification tool that integrates with Claude Code hooks to send notifications via Pushover when tasks complete.

## Features

- 🔗 **Claude Code Integration**: Seamlessly integrates with Claude Code hooks system
- 📱 **Pushover Notifications**: Send notifications to your devices via Pushover
- ✅ **TypeScript**: Written in TypeScript with strong type safety
- 🛡️ **Validation**: Comprehensive configuration validation with Zod
- 🎯 **Clear Error Messages**: Helpful error messages guide you through setup
- 🧪 **Built-in Testing**: Test script with sample data

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd claude-notify
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Make the script executable:
   ```bash
   chmod +x index.ts
   ```

## Configuration

Create a configuration file at `~/.config/claude-notify.json`:

```json
{
  "PUSHOVER_API_KEY": "your_app_token_here",
  "PUSHOVER_USER_KEY": "your_user_key_here"
}
```

### Getting Pushover Credentials

1. Visit [Pushover.net](https://pushover.net/) and create an account
2. Create a new application to get your **API Token** (PUSHOVER_API_KEY)
3. Find your **User Key** on your dashboard (PUSHOVER_USER_KEY)

## Usage

### With Claude Code Hooks

The tool is designed to work with Claude Code hooks. It reads JSON input from stdin with the following format:

```json
{
  "session_id": "84360740-01bf-4e81-b8a5-03ae77edb675",
  "transcript_path": "/home/max/.claude/projects/-home-max-projects-claude-notify/84360740-01bf-4e81-b8a5-03ae77edb675.jsonl",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

### Manual Testing

Run the test script to verify your setup:

```bash
bun run test
```

### Direct Usage

You can also pipe JSON data directly to the tool:

```bash
echo '{"session_id": "test", "transcript_path": "~/test.jsonl", "hook_event_name": "Stop", "stop_hook_active": false}' | bun run index.ts
```

## Scripts

- `bun run start` - Run the application
- `bun run test` - Test with sample data
- `bun run build` - Build the application
- `bun run dev` - Run in development mode with file watching

## Error Handling

The tool provides comprehensive error messages for common issues:

- **Missing configuration file**: Clear setup instructions
- **Invalid JSON**: Specific syntax error guidance
- **Missing credentials**: Detailed validation errors
- **Invalid API responses**: Pushover API error details

## Requirements

- [Bun](https://bun.sh/) runtime
- Pushover account and API credentials
- Claude Code (for hook integration)

## Development

The project uses:
- **TypeScript** for type safety
- **Zod** for schema validation
- **Bun** as the runtime
- **Pushover API** for notifications

## License

MIT