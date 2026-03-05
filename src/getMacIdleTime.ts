export async function getMacIdleTime(): Promise<number> {
  const proc = Bun.spawn(["ioreg", "-c", "IOHIDSystem"], { stdout: "pipe" });
  const output = await new Response(proc.stdout).text();
  const match = output.match(/"HIDIdleTime"\s*=\s*(\d+)/);
  if (!match) return 0;
  return parseInt(match[1]) / 1_000_000_000;
}
