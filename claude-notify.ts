#!/usr/bin/env bun

import { InputSchema } from "./src/schemas/input"
import { loadConfig } from "./src/loadConfig"
import { sendNtfyNotification } from "./src/sendNtfyNotification"
import { parseArgs } from "./src/parseArgs"

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString()
}

async function main(): Promise<void> {
  try {
    const { configPath } = parseArgs()
    const config = loadConfig(configPath)
    const stdinContent = await readStdin()

    console.error("Received input from stdin:", stdinContent)

    if (!stdinContent.trim()) {
      console.error("No input received from stdin")
      process.exit(1)
    }

    const rawInput = JSON.parse(stdinContent)
    const inputData = InputSchema.parse(rawInput)

    await sendNtfyNotification(config, inputData)
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

main()
