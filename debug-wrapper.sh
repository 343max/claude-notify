#!/bin/bash

# Debug wrapper for claude-notify
# Logs stdin, stdout, and stderr to files for debugging

# Create logs directory if it doesn't exist
LOGS_DIR="$HOME/.claude/claude-notify-logs"
mkdir -p "$LOGS_DIR"

# Single log file for everything
LOG_FILE="$LOGS_DIR/claude-notify.log"

# Get the directory where this script is located
SCRIPT_DIR="/home/max/projects/claude-notify"

# Log the start of execution
echo "$(date '+%Y-%m-%d %H:%M:%S') ==================== STARTING CLAUDE-NOTIFY ====================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') Args: $*" >> "$LOG_FILE"

# Read stdin and save it to a file, then pass it to the main script
stdin_content=$(cat)

# Log the stdin content
echo "$(date '+%Y-%m-%d %H:%M:%S') STDIN:" >> "$LOG_FILE"
echo "$stdin_content" >> "$LOG_FILE"

# Create temporary files for capturing output
temp_stdout=$(mktemp)
temp_stderr=$(mktemp)

# Run the main script with stdin, capturing stdout and stderr
echo "$stdin_content" | "$SCRIPT_DIR/index.ts" "$@" > "$temp_stdout" 2> "$temp_stderr"

# Capture the exit code
exit_code=$?

# Log stdout content
if [ -s "$temp_stdout" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') STDOUT:" >> "$LOG_FILE"
  while IFS= read -r line; do
    echo "$line" >> "$LOG_FILE"
  done < "$temp_stdout"
fi

# Log stderr content
if [ -s "$temp_stderr" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') STDERR:" >> "$LOG_FILE"
  while IFS= read -r line; do
    echo "$line" >> "$LOG_FILE"
  done < "$temp_stderr"
fi

# Clean up temp files
rm -f "$temp_stdout" "$temp_stderr"

# Log the exit code
echo "$(date '+%Y-%m-%d %H:%M:%S') Exit code: $exit_code" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') ==================== FINISHED ====================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Print log file location
echo "Debug log: $LOG_FILE" >&2

# Exit with the same code as the main script
exit $exit_code