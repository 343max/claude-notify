import process from "node:process"
import {expect, test} from "bun:test"
import {getIdleTime} from "./getIdleTime"

test("returns idle time in seconds", async () => {
  const seconds = await getIdleTime()

  if (process.platform === "darwin") {
    expect(typeof seconds).toBe("number")
    expect(seconds).toBeGreaterThanOrEqual(0)
  } else {
    expect(seconds === undefined || typeof seconds === "number").toBe(true)
    if (typeof seconds === "number") {
      expect(seconds).toBeGreaterThanOrEqual(0)
    }
  }
})
