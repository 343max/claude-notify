export async function sendLocalNotification(
  title: string,
  message: string,
  clickUrl?: string,
): Promise<void> {
  if (Bun.which("terminal-notifier")) {
    const args = ["terminal-notifier", "-title", title, "-message", message]
    if (clickUrl) {
      args.push("-open", clickUrl)
    }

    const proc = Bun.spawn(args)
    await proc.exited
  } else if (Bun.which("notify-send")) {
    const proc = Bun.spawn(["notify-send", title, message])
    await proc.exited
  } else if (Bun.which("osascript")) {
    const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`
    const proc = Bun.spawn(["osascript", "-e", script])
    await proc.exited
  }
}
