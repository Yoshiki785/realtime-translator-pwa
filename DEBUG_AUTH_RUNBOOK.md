# DEBUG_AUTH_RUNBOOK

Timestamp: 2026-01-10 21:45:24

Current symptom:
- Settings/Start buttons unresponsive
- Login fails with "Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)"

---

## A0 - Initialize state/runbook
- Found: Missing DEBUG_AUTH_STATE.json and DEBUG_AUTH_RUNBOOK.md; created both.
- Changed: Added DEBUG_AUTH_STATE.json and DEBUG_AUTH_RUNBOOK.md.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: N/A (initialization step only).

## A1 - Identify deployed URL and hosting config
- Found: .firebaserc default project "realtime-translator-pwa"; firebase.json hosting.public="public" with rewrites to Cloud Run service "realtime-translator-api" (asia-northeast1). Expected UI URL: https://realtime-translator-pwa.web.app (or firebaseapp.com). Expected API: same-origin paths via Hosting rewrites, not direct run.app.
- Changed: None.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: Open Hosting URL (web.app) and confirm URL bar is not run.app.

## A2 - Locate Firebase init and double-init
- Found: firebaseConfig defined in static/app.js (and generated public/app.js). Only manual firebase.initializeApp present; no /__/firebase/init.js or useEmulator references. Double init: NO.
- Changed: None.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: N/A (inspection step only).

## A3 - Fix Firebase config source-of-truth
- Found: firebaseConfig previously embedded in static/app.js; invalid API key likely causes auth/api-key-not-valid and script abort.
- Changed: Added static/firebase-config.js with TODO placeholders (single source); index.html loads it; app.js reads window.FIREBASE_CONFIG and reports init status with apiKey prefix/projectId/authDomain; added firebase status area + styles; sw.js cache version bumped and includes firebase-config.js.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: Update static/firebase-config.js with Firebase Console config; reload page and confirm firebase status line shows initialized + correct projectId/authDomain.

## A4 - Eliminate double initialization
- Found: No /__/firebase/init.js usage; only firebase.initializeApp in static/app.js.
- Changed: Explicitly use window.FIREBASE_CONFIG and single initializeApp guarded by firebase.apps?.length.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: Console shows only one Firebase init and no duplicate-app errors.

## A5 - Restore UI interactivity on auth failure
- Found: Button handlers bound at module load; Firebase init errors could abort script and leave UI inert.
- Changed: Bind Start/Settings/Login/Logout after DOMContentLoaded; initFirebase wrapped in try/catch; Start now shows friendly error when Firebase init fails; login/logout guarded if auth missing; added UI status line.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: With missing config, Settings opens and Start shows error instead of freezing; no uncaught exceptions in console.

## A6 - Sync static to public
- Found: static/ contains updated app.js, index.html, styles.css, sw.js plus firebase-config.js.
- Changed: Destructive sync: rm -rf public/* and copied static/* to public/ (including firebase-config.js).
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: public/index.html, public/app.js, public/styles.css, public/manifest.json, public/sw.js exist; public/firebase-config.js present.

## A7 - Verification checklist
- Found: N/A (documentation step).
- Changed: Added strict verification checklist for Hosting + Service Worker cache.
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify:
  1) Open Hosting URL (web.app), NOT run.app.
  2) DevTools Console: no errors at load.
  3) Application → Service Workers: Unregister.
  4) Application → Storage: Clear site data.
  5) Hard reload with cache disabled.
  6) Retry login; if api-key-not-valid persists, re-check firebase-config.js and project.

## A8 - Deploy
- Found: Deployment should target Firebase Hosting only.
- Changed: Provided deploy command (not executed).
- Diff (git diff --name-only): DEPLOY_RUNBOOK.md, app.py, public/app.js, public/index.html, public/manifest.json, public/styles.css, public/sw.js, static/app.js, static/index.html, static/manifest.json, static/styles.css, static/sw.js.
- Verify: Run `firebase deploy --only hosting` after updating firebase-config.js.
