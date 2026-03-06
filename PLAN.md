# Linux Compatibility Plan

## Problem

Two files hard-code macOS-specific executables:

1. **`src/sendLocalNotification.ts`** — falls back to `osascript` (macOS only)
2. **`src/getMacIdleTime.ts`** — uses `ioreg -c IOHIDSystem` (macOS only)

## Changes

### 1. `src/sendLocalNotification.ts`

Don't check `process.platform`. Instead, probe for binaries in order:

```
if terminal-notifier in PATH: use it (supports clickUrl via -open)
else if notify-send in PATH:  use it (clickUrl silently ignored)
else if osascript in PATH:    use it
else: silently skip — no crash
```

`notify-send` syntax: `notify-send "Title" "Message"`
(click URL is not natively supported; the argument is simply dropped)

### 2. `src/getMacIdleTime.ts` → `src/getIdleTime.ts`

Rename file, function, and test. Don't check `process.platform`. Instead probe
for binaries in order:

```
if ioreg in PATH:      use it (macOS) → return seconds
if xprintidle in PATH: use it (Linux X11) → parse ms, return seconds
else: return null
```

`null` means "idle time unavailable". The caller in `claude-notify.ts` must
treat `null` as always-send:

```
// current:
if (config.AWAY_FROM_KEYBOARD_TIMEOUT === null || (await getMacIdleTime()) > config.AWAY_FROM_KEYBOARD_TIMEOUT)

// new:
const idleTime = await getIdleTime()
if (idleTime === null || config.AWAY_FROM_KEYBOARD_TIMEOUT === null || idleTime > config.AWAY_FROM_KEYBOARD_TIMEOUT)
```

The test needs two cases based on `process.platform`:
- macOS (`darwin`): `ioreg` is always present → expect a positive number
- other platforms: `null` is a valid return; if a number, expect it to be positive

## Files to change

| File | Action | Change |
|------|--------|--------|
| `src/sendLocalNotification.ts` | edit | Probe binaries in order: `terminal-notifier` → `notify-send` → `osascript`; silently skip if none found |
| `src/getMacIdleTime.ts` | rename → `src/getIdleTime.ts` | Probe binaries (`ioreg`, `xprintidle`); return `number \| null` |
| `src/getMacIdleTime.test.ts` | rename → `src/getIdleTime.test.ts` | Update import + function name + handle `null` return |
| `claude-notify.ts` | edit | Update import name/path; treat `null` idle time as always-send |

No other files need to change.
