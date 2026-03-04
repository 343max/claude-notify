# Claude Notify

A command-line notification tool that integrates with Claude Code hooks to send notifications via [ntfy](https://ntfy.sh) when tasks complete.

# Installation

1. You need [bun](https://bun.sh)
2. Create `~/.config/claude-notify.json`

The minimum config is:

```json
{
  "NTFY_URL": "https://ntfy.sh",
  "NTFY_TOPIC": "my-claude-notifications"
}
```

## Config options

`NTFY_URL` — Base URL of your ntfy server. Use `https://ntfy.sh` for the public instance or your self-hosted URL.

`NTFY_TOPIC` — The topic name to publish notifications to.

`BUSY_TIME` — Time in seconds a prompt has to run before you get notified (default: `20`). 20 seconds is the sweetspot for when you start drifting away from the output.

### Authorization

For self-hosted ntfy instances with access control, use a Bearer token:

```json
{
  "NTFY_URL": "https://ntfy.example.com",
  "NTFY_TOPIC": "claude",
  "NTFY_TOKEN": "your-bearer-token"
}
```

Or Basic auth credentials:

```json
{
  "NTFY_USERNAME": "your-username",
  "NTFY_PASSWORD": "your-password"
}
```

### Click URL

`CLICK_URL_PREFIX` — Optional. When set, the notification includes a tappable link. The value is used as a URL prefix and the project path (`cwd`) is appended directly — so include any path/query separator in the prefix itself.

For a remote **code-server** instance:

```json
{
  "CLICK_URL_PREFIX": "https://your-code-server:8443/?folder="
}
```

For **VS Code** on your local machine:

```json
{
  "CLICK_URL_PREFIX": "vscode://file/"
}
```

## Setup

3. Run `claude`, type `/hooks` and pick the stop hook. Add the full path to `claude-notify.ts`.

Afterwards you should receive a notification when a long-running prompt finishes.

## License

MIT
