# STT Stability Debug Checklist

This document outlines how to observe the new STT stabilization behavior in debug mode.

## Quick Steps

1. Open the app with `?debug=1` (optional: `&sttAutoLock=1` to test session.update).
2. Start a session and speak for 20–30 seconds.
3. Stop the session.

## What to Verify

- Developer Panel shows `STT autoLock` and the detected `locked` language.
- Diagnostic logs show `STT auto-lock observed: <lang>` after the first final transcript.
- If glossary replacements occur, diagnostic logs show a `STT postprocess applied` entry.

## Notes

- Auto language lock only sends `session.update` when `sttAutoLock=1` is explicitly enabled.
- Default behavior remains unchanged unless debug flags are used.
