I want you to write a command line tool using bun that useses claude code hooks to notify the user when a new notification arrived. Use pushover to send the notifcations.

The tool will be launched and all the arguments will come as json from stdin. Here is a sample input:

```
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "message": "Task completed successfully",
  "title": "Claude Code"
}
```

Use this information to send a messaage using pushover.

The app will be configured using a json configuration file found at ~/.config/claude-notify.json. If the file doesn't exists the user should be told to create it and the app should exit. Otherwise the notifcation should be sent via the pushover api.
