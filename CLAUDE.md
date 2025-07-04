# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a command-line notification tool built with Bun that integrates with Claude Code hooks to send notifications via Pushover when tasks complete. The tool reads JSON input from stdin and sends notifications based on the provided session data.

## Architecture

- **Input**: JSON data from stdin containing session_id, transcript_path, message, and title
- **Configuration**: JSON config file at `~/.config/claude-notify.json` with Pushover API credentials
- **Output**: Pushover notifications sent via API

## Key Requirements

- Uses Bun as the runtime
- Integrates with Claude Code hooks system
- Reads configuration from `~/.config/claude-notify.json`
- Exits with error message if config file doesn't exist
- Sends notifications via Pushover API

## Configuration Format

The config file should contain:
```json
{
  "PUSHOVER_API_KEY": "your_api_key_here"
}
```

## Input Format

Expected stdin JSON format:
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "message": "Task completed successfully",
  "title": "Claude Code"
}
```