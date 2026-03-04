import { z } from "zod"

export const InputSchema = z.object({
  session_id: z.string(),
  transcript_path: z.string(),
  cwd: z.string(),
  permission_mode: z.string().optional(),
  hook_event_name: z.union([
    z.literal("PermissionRequest"),
    z.literal("PostToolUse"),
    z.literal("PostToolUseFailure"),
    z.literal("PreToolUse"),
    z.literal("Stop"),
    z.literal("SubagentStop"),
    z.literal("TaskCompleted"),
    z.literal("UserPromptSubmit"),
    z.literal("ConfigChange"),
    z.literal("Notification"),
    z.literal("PreCompact"),
    z.literal("SessionEnd"),
    z.literal("SessionStart"),
    z.literal("SubagentStart"),
    z.literal("TeammateIdle"),
    z.literal("WorktreeCreate"),
    z.literal("WorktreeRemove"),
  ]),
  stop_hook_active: z.boolean().optional(),
  last_assistant_message: z.string().optional(),
})

export type ClaudeNotificationInput = z.infer<typeof InputSchema>
