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
  "BUSY_TIME": 12
}
```

`BUSY_TIME` is the time in seconds how long a prompt has to run before you will get notified. 12 seconds seems to be the sweetspot for me where I start to stop looking at the claude output and drift off.

3. run `claude`, type in `/hooks` and pick the stop hook. Then add the full path to the `claude-notify.ts` file.

Afterwards you should receive a notification a long running prompt is finished. It seems to work pretty reliably for me, but the claude transcript format is a mess and I didn't write this code, so … who knows?

## License

MIT
