export async function getMacIdleTime(): Promise<number> {
  const proc = Bun.spawn(["ioreg", "-c", "IOHIDSystem"], {stdout: "pipe"})
  const output = await new Response(proc.stdout).text()
  const match = /"HIDIdleTime"\s*=\s*(\d+)/.exec(output)
  if (!match) {
    return 0
  }

  return Number.parseInt(match[1], 10) / 1_000_000_000
}
