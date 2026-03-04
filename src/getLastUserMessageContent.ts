import { UserMessage } from "./schemas/transcript"

const SYSTEM_TAG_PATTERN = /^<[a-z_-]+>[\s\S]*<\/[a-z_-]+>$/

function isSystemTag(s: string): boolean {
  return SYSTEM_TAG_PATTERN.test(s.trim())
}

export function getLastUserMessageContent(content: UserMessage["content"]): string | null {
  if (typeof content === "string") {
    return isSystemTag(content) ? null : content
  }

  const userTexts = content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .filter((text) => !isSystemTag(text))

  return userTexts.length > 0 ? userTexts.join("\n") : null
}
