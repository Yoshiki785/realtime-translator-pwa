# AI Workflow (UI Regression Prevention)

## Summary (Latest Update)
- Files: `AI_WORKFLOW.md` (new), `scripts/deploy_hosting.sh` (new)
- Intent: Document the static→public workflow, forbid direct edits to `public/`, and standardize pre-deploy checks to prevent blank/white screen regressions.

## Project Assumptions (Must Keep)
- Source of truth: `static/`
- Generated output served by Firebase Hosting: `public/`
- `public/` is always regenerated from `static/` before deploy.

## Allowed / Forbidden Edits
- ✅ Allowed: `static/**`, docs, scripts, config.
- ❌ Forbidden: Direct edits to `public/**` (generated artifacts only).
- ✅ Allowed: Overwrite `public/` by syncing from `static/`.

## Standard Sync & Deploy Workflow
1) Destructive sync (always from repo root):
   - `rm -rf public/*`
   - `cp -R static/* public/`
2) Required files check in `public/`:
   - `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js`
3) Local sanity check (optional but recommended):
   - `cd public && python3 -m http.server 8080`
   - Open `http://localhost:8080` and confirm UI + buttons.
4) Diff review before deploy:
   - `git status -sb`
   - `git diff --stat`
5) Deploy:
   - `firebase deploy --only hosting`

## Pre-Deploy Checklist (Required)
- `public/` regenerated from `static/` (no hand edits).
- Required files exist in `public/`.
- `git diff --stat` reviewed and shared (no unexpected files).
- Local UI loads and Start/Settings are clickable.

## Service Worker (sw.js) Rules
- When updating `static/sw.js` or cached assets:
  - Bump the cache name/version string.
  - Ensure asset paths match hosted root paths (e.g., `/app.js`).
- Cache recovery steps (for QA):
  - Chrome DevTools → Application → Service Workers → Unregister
  - Application → Storage → Clear site data
  - Hard reload with cache disabled
  - Re-test in Incognito

## AI作業依頼テンプレ（短文）
```
目的: UI白画面回帰防止。
static/のみ編集。public/直接編集禁止。
static→public同期と差分提示まで実施。
```

## Failure Handling (Standard Response)
- Capture logs: browser console, deploy output.
- Capture diffs: `git status -sb`, `git diff --stat`.
- Provide: up to 2 likely causes, up to 2 next actions.
- Stop on failure and report clearly.

## Sync Scripts (Automated)
Scripts to prevent static/public drift:

| Script | Purpose |
|--------|---------|
| `./scripts/sync_public.sh` | Copy static/{app.js,index.html} to public/ |
| `./scripts/check_public_sync.sh` | Verify static/ and public/ are identical |

### Usage
```bash
# Manual sync
./scripts/sync_public.sh

# Check for drift
./scripts/check_public_sync.sh

# Full deploy (sync + check + deploy)
npm run deploy:hosting
```

### Automatic Enforcement
- `firebase deploy --only hosting` runs both scripts via `predeploy` hook
- Deploy fails if drift is detected
