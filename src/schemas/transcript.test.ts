import {expect, test} from "bun:test"
import {TranscriptRecordSchema} from "./transcript"

const baseRecord = {
  parentUuid: "3abe3526-a68b-40a4-9743-7f9c621be221",
  isSidechain: false,
  uuid: "d9f26d0f-dea6-4a3f-82e8-5e96135111da",
  timestamp: "2026-03-16T16:08:26.195Z",
  sessionId: "917286b2-60e5-4a66-888b-950df8cf99f9",
  cwd: "/private/tmp/hello-lm-studio-claude",
  version: "2.1.76",
  gitBranch: "HEAD",
  userType: "external",
  requestId: "req_011CZ73kMmAi2tFK4799RmQ9",
}

test("parses assistant record with Agent tool_use block", () => {
  const record = {
    ...baseRecord,
    type: "assistant",
    message: {
      model: "claude-sonnet-4-6",
      id: "msg_01FbRqAUMb9eRjRc5PUwSzPv",
      type: "message",
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "toolu_01Mmp6smr1ohvPwhnNeBWr7i",
          name: "Agent",
          input: {
            description: "Plan audio transcription with parakeet",
            subagent_type: "plan-bot",
            prompt: "...",
          },
        },
      ],
      stop_reason: "tool_use",
      stop_sequence: null,
      usage: {
        input_tokens: 3,
        output_tokens: 381,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 16374,
        cache_creation: {
          ephemeral_5m_input_tokens: 0,
          ephemeral_1h_input_tokens: 0,
        },
      },
    },
  }

  expect(() => TranscriptRecordSchema.parse(record)).not.toThrow()
  const parsed = TranscriptRecordSchema.parse(record)
  expect(parsed.type).toBe("assistant")
  if (parsed.type === "assistant") {
    const block = parsed.message.content[0]
    expect(block.type).toBe("tool_use")
    if (block.type === "tool_use") {
      expect(block.name).toBe("Agent")
    }
  }
})

test("parses queue-operation record with popAll operation", () => {
  const record = {
    type: "queue-operation",
    operation: "popAll",
    timestamp: "2026-03-16T16:29:19.652Z",
    sessionId: "917286b2-60e5-4a66-888b-950df8cf99f9",
    content: "code .",
  }

  expect(() => TranscriptRecordSchema.parse(record)).not.toThrow()
  const parsed = TranscriptRecordSchema.parse(record)
  expect(parsed.type).toBe("queue-operation")
  if (parsed.type === "queue-operation") {
    expect(parsed.operation).toBe("popAll")
  }
})
