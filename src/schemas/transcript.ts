import {z} from "zod"

// --- Enums ---

const BuiltInToolNameSchema = z.enum([
  "AskUserQuestion",
  "Bash",
  "Edit",
  "EnterPlanMode",
  "EnterWorktree",
  "ExitPlanMode",
  "Glob",
  "Grep",
  "Read",
  "Task",
  "TodoWrite",
  "ToolSearch",
  "WebFetch",
  "WebSearch",
  "Write",
])

// MCP tools follow the pattern mcp__<server>__<tool> and are user-defined
const McpToolNameSchema = z.string().regex(/^mcp__/)

const ToolNameSchema = z.union([BuiltInToolNameSchema, McpToolNameSchema])

const QueueOperationSchema = z.enum(["enqueue", "dequeue", "remove"])

const PermissionModeSchema = z.enum(["plan", "bypassPermissions", "acceptEdits", "default"])

const HookEventSchema = z.enum(["PreToolUse", "PostToolUse", "Stop", "SessionStart"])

const UserTypeSchema = z.enum(["external"])

// --- Content Blocks ---

const ThinkingBlockSchema = z.object({
  type: z.literal("thinking"),
  thinking: z.string(),
  signature: z.string(),
})

const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
})

const ToolUseBlockSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: ToolNameSchema,
  input: z.record(z.string(), z.unknown()),
})

const ImageBlockSchema = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    media_type: z.string(),
    data: z.string(),
  }),
})

const ToolReferenceBlockSchema = z.object({
  type: z.literal("tool_reference"),
  tool_name: ToolNameSchema,
})

const ToolResultContentBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  ImageBlockSchema,
  ToolReferenceBlockSchema,
])

const ToolResultBlockSchema = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string(),
  content: z.union([z.string(), z.array(ToolResultContentBlockSchema)]),
  is_error: z.boolean().optional().nullable(),
})

const AssistantContentBlockSchema = z.discriminatedUnion("type", [
  ThinkingBlockSchema,
  TextBlockSchema,
  ToolUseBlockSchema,
])

const UserContentBlockSchema = z.discriminatedUnion("type", [TextBlockSchema, ToolResultBlockSchema])

// --- Usage ---

const CacheCreationSchema = z.object({
  ephemeral_5m_input_tokens: z.number(),
  ephemeral_1h_input_tokens: z.number(),
})

const UsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_creation_input_tokens: z.number(),
  cache_read_input_tokens: z.number(),
  cache_creation: CacheCreationSchema,
  service_tier: z.string().nullish(),
  inference_geo: z.string().nullish(),
})

// --- Message Envelopes ---

const AssistantMessageSchema = z.object({
  model: z.string(),
  id: z.string(),
  type: z.literal("message"),
  role: z.literal("assistant"),
  content: z.array(AssistantContentBlockSchema),
  stop_reason: z.string().nullable(),
  stop_sequence: z.string().nullable(),
  usage: UsageSchema,
})

const UserMessageSchema = z.object({
  role: z.literal("user"),
  content: z.union([z.string(), z.array(UserContentBlockSchema)]),
})

export type UserMessage = z.infer<typeof UserMessageSchema>

// --- Progress Data ---

const BashProgressDataSchema = z.object({
  type: z.literal("bash_progress"),
  output: z.string(),
  fullOutput: z.string(),
  elapsedTimeSeconds: z.number(),
  totalLines: z.number(),
  totalBytes: z.number(),
  taskId: z.string(),
  timeoutMs: z.number().optional(),
})

const AgentProgressDataSchema = z.object({
  type: z.literal("agent_progress"),
  message: z.unknown().optional(), // Can be a string or a full message record object
  normalizedMessages: z.array(z.unknown()).optional(),
  agentId: z.string().optional(),
  prompt: z.string().optional(),
})

const HookProgressDataSchema = z.object({
  type: z.literal("hook_progress"),
  hookEvent: HookEventSchema,
  hookName: z.string(),
  command: z.string(),
})

const McpProgressDataSchema = z.object({
  type: z.literal("mcp_progress"),
  status: z.enum(["started", "completed"]),
  serverName: z.string(),
  toolName: z.string(),
})

const ProgressDataSchema = z.discriminatedUnion("type", [
  BashProgressDataSchema,
  AgentProgressDataSchema,
  HookProgressDataSchema,
  McpProgressDataSchema,
])

// --- Common Fields ---

const CommonFields = {
  parentUuid: z.string().nullable(),
  uuid: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  isSidechain: z.boolean(),
  cwd: z.string(),
  version: z.string(),
  gitBranch: z.string().optional().nullable(),
  slug: z.string().optional(),
  userType: UserTypeSchema,
}

// --- Top-Level Records ---

const UserRecordSchema = z.object({
  type: z.literal("user"),
  message: UserMessageSchema,
  permissionMode: PermissionModeSchema.optional(),
  ...CommonFields,
})

const AssistantRecordSchema = z.object({
  type: z.literal("assistant"),
  message: AssistantMessageSchema,
  requestId: z.string().optional(),
  ...CommonFields,
})

const ProgressRecordSchema = z.object({
  type: z.literal("progress"),
  data: ProgressDataSchema,
  toolUseID: z.string().optional(),
  parentToolUseID: z.string().optional(),
  ...CommonFields,
})

const StopHookSummaryRecordSchema = z.object({
  type: z.literal("system"),
  subtype: z.literal("stop_hook_summary"),
  hookCount: z.number(),
  hookInfos: z.array(z.unknown()),
  hookErrors: z.array(z.unknown()),
  preventedContinuation: z.boolean(),
  stopReason: z.string(),
  hasOutput: z.boolean(),
  level: z.literal("suggestion"),
  toolUseID: z.string().optional(),
  ...CommonFields,
})

const TurnDurationRecordSchema = z.object({
  type: z.literal("system"),
  subtype: z.literal("turn_duration"),
  durationMs: z.number(),
  isMeta: z.boolean(),
  ...CommonFields,
})

const LocalCommandRecordSchema = z.object({
  type: z.literal("system"),
  subtype: z.literal("local_command"),
  content: z.string(),
  level: z.literal("info"),
  isMeta: z.boolean(),
  ...CommonFields,
})

const QueueOperationRecordSchema = z.object({
  type: z.literal("queue-operation"),
  operation: QueueOperationSchema,
  timestamp: z.string(),
  sessionId: z.string(),
})

const FileHistorySnapshotRecordSchema = z.object({
  type: z.literal("file-history-snapshot"),
  messageId: z.string(),
  snapshot: z.object({
    messageId: z.string(),
    trackedFileBackups: z.record(z.string(), z.unknown()),
    timestamp: z.string(),
  }),
  isSnapshotUpdate: z.boolean(),
})

const PrLinkRecordSchema = z.object({
  type: z.literal("pr-link"),
  sessionId: z.string(),
  prNumber: z.number(),
  prUrl: z.string(),
  prRepository: z.string(),
  timestamp: z.string(),
})

export const TranscriptRecordSchema = z.union([
  UserRecordSchema,
  AssistantRecordSchema,
  ProgressRecordSchema,
  StopHookSummaryRecordSchema,
  TurnDurationRecordSchema,
  LocalCommandRecordSchema,
  QueueOperationRecordSchema,
  FileHistorySnapshotRecordSchema,
  PrLinkRecordSchema,
])

export type TranscriptRecord = z.infer<typeof TranscriptRecordSchema>
