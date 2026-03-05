import {readFileSync} from "node:fs"
import {z} from "zod"
import {TranscriptRecordSchema} from "./schemas/transcript"
import {getLastUserMessageContent} from "./getLastUserMessageContent"

function parseLine(line: string): {content: string; cwd: string; timestamp: string} | undefined {
  const parsed = TranscriptRecordSchema.parse(JSON.parse(line))

  if (parsed.type !== "user" || parsed.message.role !== "user") {
    return null
  }

  const content = getLastUserMessageContent(parsed.message.content)
  if (content === null) {
    return null
  }

  return {
    content,
    cwd: parsed.cwd,
    timestamp: parsed.timestamp,
  }
}

export async function getLastUserMessage(transcriptPath: string): Promise<{content: string; cwd: string; timestamp: string} | undefined> {
  try {
    const content = readFileSync(transcriptPath.replace(/^~/, process.env.HOME ?? ""), "utf8")
    const lines = content.trim().split("\n")

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (!line) {
        continue
      }

      try {
        const userMessage = parseLine(line)
        if (userMessage) {
          return userMessage
        }
      } catch (parseError) {
        console.error(`Failed to parse line ${i}:`, parseError instanceof Error ? parseError.message : "Unknown error")
        console.error("Line content:", line)
        process.exit(1)
      }
    }

    return null
  } catch (error) {
    throw new Error(`Failed to read transcript: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
