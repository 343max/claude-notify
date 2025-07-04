#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

interface ClaudeNotificationInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
  stop_hook_active: boolean;
}

const ConfigSchema = z.object({
  PUSHOVER_API_KEY: z.string()
    .min(1, 'PUSHOVER_API_KEY cannot be empty')
    .regex(/^[a-zA-Z0-9]+$/, 'PUSHOVER_API_KEY must contain only alphanumeric characters'),
  PUSHOVER_USER_KEY: z.string()
    .min(1, 'PUSHOVER_USER_KEY cannot be empty')
    .regex(/^[a-zA-Z0-9]+$/, 'PUSHOVER_USER_KEY must contain only alphanumeric characters'),
  BUSY_TIME: z.number()
    .min(1, 'BUSY_TIME must be at least 1 second')
    .optional()
    .default(20)
});

type Config = z.infer<typeof ConfigSchema>;

interface PushoverRequest {
  token: string;
  user: string;
  message: string;
  title: string;
}

interface PushoverResponse {
  status: number;
  request: string;
  errors?: string[];
}

interface UserMessage {
  type: string;
  message: {
    role: string;
    content: string;
  };
  timestamp: string;
  cwd: string;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString();
}

async function getLastUserMessage(transcriptPath: string): Promise<UserMessage | null> {
  try {
    const content = readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n');
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'user' && parsed.message?.role === 'user') {
          return parsed as UserMessage;
        }
      } catch (parseError) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to read transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function loadConfig(): Config {
  const configPath = join(homedir(), '.config', 'claude-notify.json');
  
  if (!existsSync(configPath)) {
    console.error('❌ Configuration file not found at ~/.config/claude-notify.json');
    console.error('');
    console.error('Please create this file with your Pushover API credentials:');
    console.error('');
    console.error('Example configuration:');
    console.error('{');
    console.error('  "PUSHOVER_API_KEY": "your_app_token_here",');
    console.error('  "PUSHOVER_USER_KEY": "your_user_key_here",');
    console.error('  "BUSY_TIME": 20');
    console.error('}');
    console.error('');
    console.error('Get your credentials from: https://pushover.net/');
    process.exit(1);
  }
  
  try {
    const configContent = readFileSync(configPath, 'utf8');
    
    let parsedConfig: unknown;
    try {
      parsedConfig = JSON.parse(configContent);
    } catch (parseError) {
      console.error('❌ Invalid JSON in configuration file');
      console.error('');
      console.error('The configuration file contains invalid JSON syntax.');
      console.error('Please check your ~/.config/claude-notify.json file and ensure it is valid JSON.');
      console.error('');
      console.error('Example valid configuration:');
      console.error('{');
      console.error('  "PUSHOVER_API_KEY": "your_app_token_here",');
      console.error('  "PUSHOVER_USER_KEY": "your_user_key_here",');
      console.error('  "BUSY_TIME": 20');
      console.error('}');
      process.exit(1);
    }
    
    const validationResult = ConfigSchema.safeParse(parsedConfig);
    
    if (!validationResult.success) {
      console.error('❌ Invalid configuration');
      console.error('');
      console.error('The following configuration errors were found:');
      
      validationResult.error.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error.path.join('.')}: ${error.message}`);
      });
      
      console.error('');
      console.error('Expected configuration format:');
      console.error('{');
      console.error('  "PUSHOVER_API_KEY": "your_app_token_here",');
      console.error('  "PUSHOVER_USER_KEY": "your_user_key_here",');
      console.error('  "BUSY_TIME": 20');
      console.error('}');
      console.error('');
      console.error('Requirements:');
      console.error('- PUSHOVER_API_KEY: Required, must be alphanumeric (app token)');
      console.error('- PUSHOVER_USER_KEY: Required, must be alphanumeric (user key)');
      console.error('- BUSY_TIME: Optional, minimum delay in seconds (default: 20)');
      console.error('');
      console.error('Get your credentials from: https://pushover.net/');
      process.exit(1);
    }
    
    return validationResult.data;
  } catch (error) {
    console.error('❌ Error reading configuration file:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function sendPushoverNotification(config: Config, data: ClaudeNotificationInput): Promise<void> {
  const { PUSHOVER_API_KEY, PUSHOVER_USER_KEY, BUSY_TIME } = config;
  
  const lastUserMessage = await getLastUserMessage(data.transcript_path);
  
  if (!lastUserMessage) {
    return;
  }
  
  const messageTimestamp = new Date(lastUserMessage.timestamp);
  const currentTime = new Date();
  const timeDifferenceSeconds = (currentTime.getTime() - messageTimestamp.getTime()) / 1000;
  
  if (timeDifferenceSeconds < BUSY_TIME) {
    return;
  }
  
  const projectName = basename(lastUserMessage.cwd);
  const userMessageContent = lastUserMessage.message.content;
  
  const message = `${projectName}: ${userMessageContent}`;
  const title = `Claude Code - ${data.hook_event_name}`;
  
  const pushoverData: PushoverRequest = {
    token: PUSHOVER_API_KEY,
    user: PUSHOVER_USER_KEY,
    message,
    title
  };
  
  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushoverData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json() as PushoverResponse;
    
    if (result.status !== 1) {
      throw new Error(`Pushover API error: ${result.errors?.join(', ') || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error sending notification:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

function validateInput(input: any): ClaudeNotificationInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected JSON object');
  }
  
  const requiredStrings = ['session_id', 'transcript_path', 'hook_event_name'];
  for (const field of requiredStrings) {
    if (!input[field] || typeof input[field] !== 'string') {
      throw new Error(`Invalid input: ${field} is required and must be a string`);
    }
  }
  
  if (typeof input.stop_hook_active !== 'boolean') {
    throw new Error('Invalid input: stop_hook_active is required and must be a boolean');
  }
  
  return input as ClaudeNotificationInput;
}

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    const stdinContent = await readStdin();
    
    if (!stdinContent.trim()) {
      console.error('No input received from stdin');
      process.exit(1);
    }
    
    const rawInput = JSON.parse(stdinContent);
    const inputData = validateInput(rawInput);
    
    await sendPushoverNotification(config, inputData);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();