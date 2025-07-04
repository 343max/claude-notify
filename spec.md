I want you to write a command line tool using bun that useses claude code hooks to notify the user when a new notification arrived. Use pushover to send the notifcations.

The tool will be launched and all the arguments will come as json from stdin. Here is a sample input:

```json
{
  "session_id": "84360740-01bf-4e81-b8a5-03ae77edb675",
  "transcript_path": "/home/max/.claude/projects/-home-max-projects-claude-notify/84360740-01bf-4e81-b8a5-03ae77edb675.jsonl",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

Use this information to send a messaage using pushover.

The app will be configured using a json configuration file found at ~/.config/claude-notify.json. If the file doesn't exists the user should be told to create it and the app should exit. Otherwise the notifcation should be sent via the pushover api.

## Transcript

the `transcript_path` point to a jsonl file. jsonl is a file format where each line of the file contains one valid json value.

So in order to read the file you need to read the file from the end line by line. You need to find the last message ofd the type user. This is an example:

```json
{
  "parentUuid": null,
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/max/projects/claude-notify",
  "sessionId": "0abf4bf0-a8c4-4f90-b28b-2dd8992e3a72",
  "version": "1.0.43",
  "type": "user",
  "message": { "role": "user", "content": "hello!" },
  "uuid": "03217ed3-826e-47c8-8633-b7bafdc8c8a7",
  "timestamp": "2025-07-04T14:20:06.742Z"
}
```

Take the `timestamp` from the message. Only send a message when the last user input is at lease BUSY_TIME seconds old (BUSY_TIME is a configurable value, default value 20 seconds). Take `message.content` and the basename of `cwd` as the content of the push notification so the user knows what this notification is about.
