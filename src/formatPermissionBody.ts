export function formatPermissionBody(toolName: string, toolInput: Record<string, unknown>): string {
  if (typeof toolInput.command === "string") return `${toolName}: ${toolInput.command}`
  if (typeof toolInput.file_path === "string") return `${toolName}: ${toolInput.file_path}`
  return `${toolName}: ${JSON.stringify(toolInput).slice(0, 200)}`
}
