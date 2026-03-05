import { expect, test } from "bun:test"
import { formatPermissionBody } from "./formatPermissionBody"

test("Bash: shows command", () => {
  expect(formatPermissionBody("Bash", { command: "make build 2>&1", timeout: 120000 })).toBe(
    "Bash: make build 2>&1",
  )
})

test("Read: shows file_path", () => {
  expect(
    formatPermissionBody("Read", { file_path: "/Users/max/Projects/parakeet.cpp/memory/MEMORY.md" }),
  ).toBe("Read: /Users/max/Projects/parakeet.cpp/memory/MEMORY.md")
})

test("Write: shows file_path, not content", () => {
  expect(
    formatPermissionBody("Write", {
      file_path: "/Users/max/Projects/claude-web/PLAN-zod.md",
      content: "# very long content...",
    }),
  ).toBe("Write: /Users/max/Projects/claude-web/PLAN-zod.md")
})

test("Edit: shows file_path, not old/new strings", () => {
  expect(
    formatPermissionBody("Edit", {
      replace_all: false,
      file_path: "/Users/max/.claude/agents/plan-bot.md",
      old_string: "/Users/max/.claude/agent-memory/planning-agent/",
      new_string: "/Users/max/.claude/agent-memory/plan-bot/",
    }),
  ).toBe("Edit: /Users/max/.claude/agents/plan-bot.md")
})

test("Glob: falls back to JSON (no command or file_path)", () => {
  const result = formatPermissionBody("Glob", {
    pattern: "**/*.{cmake,txt,hpp,cpp,md}",
    path: "/Users/max/Projects/parakeet.cpp",
  })
  expect(result).toStartWith("Glob: ")
  expect(result).toContain("**/*.{cmake,txt,hpp,cpp,md}")
})

test("real Write PermissionRequest: shows file_path, not content", () => {
  // Real stdin captured from a live PermissionRequest event
  const toolInput = {
    file_path: "/Users/max/Projects/claude-notify/PLAN.md",
    content: "Why did the push notification go to therapy?\n\nBecause it had too many unresolved issues.\n",
  }
  expect(formatPermissionBody("Write", toolInput)).toBe(
    "Write: /Users/max/Projects/claude-notify/PLAN.md",
  )
})

test("long JSON fallback is truncated to 200 chars of input", () => {
  const bigInput = { data: "x".repeat(500) }
  const result = formatPermissionBody("Task", bigInput)
  // "Task: " + 200 chars = 206
  expect(result.length).toBeLessThanOrEqual(206)
})
