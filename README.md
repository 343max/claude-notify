# Claude Notify

A command-line notification tool that integrates with Claude Code hooks to send notifications via Pushover when tasks complete.

# Installation

1. you need [bun](https://bun.sh)
2. create `~/.config/claude-notify.json`

The config format is:

```json
{
  "PUSHOVER_API_KEY": "Pushover API key",
  "PUSHOVER_USER_KEY": "User Key",
  "BUSY_TIME": 12,
  "NOTIFICATION_TTL_MINUTES": 5,
  "NOTIFICATION_SOUND": "mechanical"
}
```

`BUSY_TIME` is the time in seconds how long a prompt has to run before you will get notified. 12 seconds seems to be the sweetspot for me where I start to stop looking at the claude output and drift off.

`NOTIFICATION_TTL_MINUTES` is optional. If set, notifications will automatically disappear from your device after this many minutes. Useful for keeping your notification tray clean after you've returned to your desk.

`NOTIFICATION_SOUND` controls the notification sound (default: `mechanical`). See [all available sounds](https://pushover.net/api#sounds).

`CODE_SERVER_URL` and `CODE_SERVER_URL_TITLE` are optional. When set, the notification includes a tappable link that opens the project directly in your editor. The URL is constructed as `{CODE_SERVER_URL}/?folder={project_path}`.

For a remote **code-server** instance:

```json
{
  "CODE_SERVER_URL": "https://your-code-server:8443",
  "CODE_SERVER_URL_TITLE": "Open in Code Server"
}
```

For **VS Code** on your local machine (uses the `vscode://` URI scheme):

```json
{
  "CODE_SERVER_URL": "vscode://file/",
  "CODE_SERVER_URL_TITLE": "Open in VS Code"
}
```

3. run `claude`, type in `/hooks` and pick the stop hook. Then add the full path to the `claude-notify.ts` file.

Afterwards you should receive a notification a long running prompt is finished. It seems to work pretty reliably for me, but the claude transcript format is a mess and I didn't write this code, so … who knows?

## License

MIT
