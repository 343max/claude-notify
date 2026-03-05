# Claude Notify

A command-line notification tool that integrates with Claude Code hooks to send notifications when tasks complete or need your attention.

- **Local notification** (macOS notification center) — always fires after `BUSY_TIME`
- **Remote notification** (via [ntfy](https://ntfy.sh)) — only fires when you've been away from your keyboard for `AWAY_FROM_KEYBOARD_TIMEOUT` seconds

# Installation

1. You need [bun](https://bun.sh)
2. Optionally install [terminal-notifier](https://github.com/julienXX/terminal-notifier) for clickable local notifications: `brew install terminal-notifier`
3. Create `~/.config/claude-notify.json`

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

`BUSY_TIME` — Minimum time in seconds a prompt has to run before any notification fires (default: `20`). Keeps quick back-and-forth turns silent.

`AWAY_FROM_KEYBOARD_TIMEOUT` — Optional. Seconds of keyboard/mouse inactivity before the remote (phone) notification is sent. When set, the phone only buzzes if you've been away from your Mac for at least this long. When omitted, remote notifications always fire (original behaviour).

```json
{
  "AWAY_FROM_KEYBOARD_TIMEOUT": 300
}
```

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

### Click URLs

Two optional click URL fields let you open the project directly when tapping a notification.

`LOCAL_CLICK_URL` — Used by the macOS local notification (requires `terminal-notifier`).

`REMOTE_CLICK_URL` — Used by the ntfy push notification.

Use `{cwd}` as a placeholder for the project path. If omitted, the path is appended to the end of the URL.

For **VS Code** on your local machine:

```json
{
  "LOCAL_CLICK_URL": "vscode://file/{cwd}?windowId=_blank"
}
```

For a **code-server** instance (remote):

```json
{
  "REMOTE_CLICK_URL": "https://your-code-server:8443/?folder={cwd}"
}
```

## Testing your setup

Run this to send a test notification to all channels immediately, bypassing all time thresholds:

```sh
bun claude-notify.ts --send-example-notification
```

## Setup

4. Run `claude`, type `/hooks` and pick the stop hook. Add the full path to `claude-notify.ts`.

Afterwards you'll receive a local notification whenever a prompt finishes, and a phone notification only when you've been away from your Mac.

## License

MIT
