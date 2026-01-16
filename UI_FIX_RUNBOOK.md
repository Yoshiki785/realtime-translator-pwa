# UI Fix Runbook

Timestamp: 2026-01-10 19:56 CST
Symptom: Deployed PWA shows blank/white page; Settings/Start buttons unresponsive.

## U0 Initialize state/runbook
- Status: DONE
- Notes: Created `UI_FIX_STATE.json` with U0-U6 set to PENDING and initialized this runbook.

## U1 Identify what is being deployed/served
- Status: DONE
- Findings: `static/index.html` and `public/index.html` match in the first 50 lines.
- Findings: `public/` contains `app.js`, `styles.css`, `manifest.json`, `sw.js`, and icons.

## U2 Identify regression commits/changes
- Status: DONE
- Findings: `git status` shows modified `static/app.js`, `static/index.html`, `static/styles.css`, and matching `public/` artifacts.
- Findings: Commit `1f1280e` (“Add deployment infrastructure and authentication/billing system”) touched `static/*` and `public/*` (auth/usage UI updates).
- Notes: `public/` contains committed artifacts; treat `static/` as source of truth for restoration.

## U3 Restore frontend to last known-good
- Status: DONE
- Actions: Restored `static/app.js`, `static/index.html`, `static/styles.css` from commit `02bbb7e` (pre-auth UI) via `git checkout`.
- Actions: Updated asset paths in `static/index.html`, `static/manifest.json`, and `static/sw.js` to use root (`/`) paths for Firebase hosting.
- Actions: Bumped service worker cache name to `rt-translator-v2` and updated cached asset list to root paths.

## U4 Re-sync static -> public and deploy
- Status: FAILED
- Actions: Ran `rm -rf public/*` and `cp -R static/* public/`.
- Actions: Verified `public/` contains `app.js`, `index.html`, `styles.css`, `manifest.json`, `sw.js`, and icons.
- Error: `firebase deploy --only hosting` timed out (command timed out).
