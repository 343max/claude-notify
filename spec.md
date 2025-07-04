I want you to write a command line tool using bun that useses claude code hooks to notify the user when a new notification arrived. Use pushover to send the notifcations.

The tool will be launched and all the arguments will come as json from stdin. Here is a sample input:

```
{
  "session_id": "84360740-01bf-4e81-b8a5-03ae77edb675",
  "transcript_path": "/home/max/.claude/projects/-home-max-projects-claude-notify/84360740-01bf-4e81-b8a5-03ae77edb675.jsonl",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

Use this information to send a messaage using pushover.

The app will be configured using a json configuration file found at ~/.config/claude-notify.json. If the file doesn't exists the user should be told to create it and the app should exit. Otherwise the notifcation should be sent via the pushover api.
