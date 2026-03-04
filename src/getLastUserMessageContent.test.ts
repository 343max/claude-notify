import { test, expect } from "bun:test"
import { getLastUserMessageContent } from "./getLastUserMessageContent"

test("just string", () => {
  const content = getLastUserMessageContent("how do i enable debug mode in the vscode extension?")
  expect(content).toBe("how do i enable debug mode in the vscode extension?")
})

test("string with tool result", () => {
  const content = getLastUserMessageContent("<local-command-stdout>(no content)</local-command-stdout>")
  expect(content).toBe(null)
})

test("object tool result", () => {
  const content = getLastUserMessageContent([
    {
      tool_use_id: "toolu_01TuxJfy5ZAwxdyHQerPjZ31",
      type: "tool_result",
      content: [
        {
          type: "text",
          text: 'Perfect! I found the information about debugging hooks. Here\'s how to enable debug output for Claude Code hooks:\n\n## Enable Debug Output for Hooks\n\nThere are two main ways to see debug/verbose output when hooks run:\n\n### 1. Toggle Verbose Mode (Interactive)\n\nPress **Ctrl+O** while in a Claude Code session to toggle verbose mode. This will display hook output in the transcript, including:\n- Which hooks matched the current event\n- Exit codes returned by hooks\n- Stderr messages from your hook scripts\n\nThis is the easiest way to see what\'s happening during hook execution.\n\n### 2. Use the `--debug` Flag (CLI)\n\nRun Claude Code with the `--debug` flag to see full execution details:\n\n```bash\nclaude --debug\n```\n\nThis provides comprehensive logging including:\n- Hook lifecycle events\n- Which hooks matched and when they fired\n- Exit codes and output from each hook\n- Full JSON input and output for debugging\n\n### 3. Test Hooks Manually\n\nTo debug a specific hook script before relying on it in Claude Code, test it directly by piping sample JSON:\n\n```bash\necho \'{"tool_name":"Bash","tool_input":{"command":"ls"}}\' | ./my-hook.sh\necho $?  # Check the exit code\n```\n\nThis helps verify that your hook script works correctly and exits with the expected code.\n\n### Troubleshooting Hook Output\n\nIf you\'re not seeing output:\n\n- Make sure your hook script writes to **stderr** with `>&2` to ensure the output appears\n- Check that you\'re using the correct event type (`PreToolUse`, `PostToolUse`, `Stop`, etc.)\n- Verify the matcher pattern matches the tool name exactly (matchers are case-sensitive)\n- Ensure your hook configuration is valid JSON (no trailing commas or comments)\n\nFor more details, see the [Debug techniques section](https://code.claude.com/docs/en/hooks-guide.md#debug-techniques) in the official hooks guide.',
        },
        {
          type: "text",
          text: "agentId: a49a554f4d8546f54 (for resuming to continue this agent's work if needed)\n<usage>total_tokens: 27185\ntool_uses: 5\nduration_ms: 14957</usage>",
        },
      ],
    },
  ])
  expect(content).toBe(null)
})

test("user message with ide direction", () => {
  const content = getLastUserMessageContent([
    {
      type: "text",
      text: "<ide_opened_file>The user opened the file /Users/max/Projects/claude-notify/claude-notify.ts in the IDE. This may or may not be related to the current task.</ide_opened_file>",
    },
    {
      type: "text",
      text: "meeep!",
    },
  ])
  expect(content).toBe("meeep!")
})

test("just ide direction, no user message for some reason", () => {
  const content = getLastUserMessageContent([
    {
      type: "text",
      text: "<ide_opened_file>The user opened the file /Users/max/Projects/claude-notify/claude-notify.ts in the IDE. This may or may not be related to the current task.</ide_opened_file>",
    },
  ])
  expect(content).toBe(null)
})

test("two user messages for some reason", () => {
  const content = getLastUserMessageContent([
    {
      type: "text",
      text: "alice",
    },
    {
      type: "text",
      text: "bob",
    },
  ])
  expect(content).toBe("alice\nbob")
})
