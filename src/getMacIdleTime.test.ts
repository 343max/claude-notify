import {expect, test} from "bun:test"
import {getMacIdleTime} from "./getMacIdleTime"

test("returns a positive number of seconds", async () => {
  const seconds = await getMacIdleTime()
  console.log(`Mac idle time: ${seconds.toFixed(2)}s`)
  expect(seconds).toBeGreaterThan(0)
})
