export async function getIdleTime(): Promise<number | undefined> {
  if (Bun.which("ioreg")) {
    const proc = Bun.spawn(["ioreg", "-c", "IOHIDSystem"], {stdout: "pipe"})
    const output = await new Response(proc.stdout).text()
    const match = /"HIDIdleTime"\s*=\s*(\d+)/.exec(output)
    if (!match) {
      return 0
    }

    return Number.parseInt(match[1], 10) / 1_000_000_000
  }

  if (Bun.which("xprintidle")) {
    const proc = Bun.spawn(["xprintidle"], {stdout: "pipe"})
    const output = await new Response(proc.stdout).text()
    const ms = Number.parseInt(output.trim(), 10)
    if (!Number.isNaN(ms)) {
      return ms / 1000
    }
  }

  return undefined
}
