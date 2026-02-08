# PR #37 Reviewer Checklist (Merge Gate)

This checklist is the merge gate for PR #37 (`feat/quota-system-beta` -> `main`).

References:
- `docs/launch_mvp_runbook.md`
- `DEPLOY.md`

## 1) Functional

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Free/Pro behavior is correct (free cannot buy tickets, pro can) | [ ] | [ ] | |
| [ ] Ticket purchase flow works for supported packs and returns to app | [ ] | [ ] | |
| [ ] Quota refresh flow (`Resync`) updates state via `/api/v1/me` | [ ] | [ ] | |
| [ ] History view (`#/history`) and detail route (`#/history/<id>`) work as expected | [ ] | [ ] | |

## 2) Security

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Stripe webhook signature verification is enforced | [ ] | [ ] | |
| [ ] Auth-required APIs reject missing/invalid tokens | [ ] | [ ] | |
| [ ] No secrets or tokens are exposed in frontend/static files | [ ] | [ ] | |
| [ ] Debug-only behavior is not enabled for production paths | [ ] | [ ] | |

## 3) Billing

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Canonical ticket packs are exactly `t120,t240,t360,t1200,t1800,t3000` | [ ] | [ ] | |
| [ ] `t300` is not used anywhere (non-existent pack) | [ ] | [ ] | |
| [ ] Purchase idempotency is preserved for webhook re-delivery | [ ] | [ ] | |
| [ ] Purchase history is recorded under `users/{uid}/purchases/{session_id}` | [ ] | [ ] | |

## 4) Region

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Runbook and docs consistently require `asia-northeast1` for Cloud Run deploy commands | [ ] | [ ] | |
| [ ] Any default-region risk is documented and tracked (Task3 separate PR) | [ ] | [ ] | |

## 5) Project Mix-up Prevention

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Target Firebase project is `realtime-translator-pwa-483710` | [ ] | [ ] | |
| [ ] Commands that can target Firebase explicitly include `--project realtime-translator-pwa-483710` | [ ] | [ ] | |
| [ ] `.firebaserc` alias usage and active project checks are documented | [ ] | [ ] | |

## 6) Pricing Consistency

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] `static/config/pricing.json` is treated as source of truth | [ ] | [ ] | |
| [ ] `node ./scripts/generate_pricing.js --check` passes | [ ] | [ ] | |
| [ ] `./scripts/check_public_sync.sh` passes | [ ] | [ ] | |
| [ ] Pack IDs in `app.py` and `pricing.json` are aligned (`t120,t240,t360,t1200,t1800,t3000`) | [ ] | [ ] | |

## 7) Risks

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Known launch risks are identified with owner and mitigation | [ ] | [ ] | |
| [ ] Delayed webhook/UI sync risk has an explicit operator response path | [ ] | [ ] | |
| [ ] Logging and evidence collection points are sufficient for incident triage | [ ] | [ ] | |

## 8) Rollback

| Item | PASS | FAIL | NOTE |
|---|---|---|---|
| [ ] Hosting rollback procedure is confirmed | [ ] | [ ] | |
| [ ] Cloud Run rollback to previous revision is confirmed | [ ] | [ ] | |
| [ ] Post-rollback smoke verification steps are defined | [ ] | [ ] | |

## Reviewer Sign-off

- Reviewer:
- Date:
- Final decision: `MERGE` / `BLOCK`
- Blocking reasons (if any):

## Note for PR body

Suggested PR body add-on:
- `Reviewer checklist: docs/pr_review_checklist.md`
