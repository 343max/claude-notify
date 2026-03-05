export async function sendLocalNotification(
  title: string,
  message: string,
  clickUrl?: string,
): Promise<void> {
  const terminalNotifier = Bun.which("terminal-notifier")

  if (terminalNotifier) {
    const args = [terminalNotifier, "-title", title, "-message", message]
    if (clickUrl) {
      args.push("-open", clickUrl)
    }

    const proc = Bun.spawn(args)
    await proc.exited
  } else {
    const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`
    const proc = Bun.spawn(["osascript", "-e", script])
    await proc.exited
  }
}
