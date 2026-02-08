# Stripe Ticket Purchase E2E Guide

## Scope
This guide validates the end-to-end ticket purchase path for Launch readiness without running any deploy operation.

## Supported Packs
Canonical ticket packs:
- `t120`
- `t240`
- `t360`
- `t1200`
- `t1800`
- `t3000`

`t300` is not a valid pack and must not appear in code, config, Stripe mapping, or test inputs.

## Preconditions
- Target project is `realtime-translator-pwa-483710`.
- Test user is logged in and has `plan=pro` (free users receive `pro_required`).
- Frontend route and API behavior are based on `static/app.js`.
- Run environment can access:
  - Stripe Dashboard
  - Cloud Run logs
  - Firestore Admin view
  - Browser devtools console

## Happy Path (Purchase -> Webhook -> Quota -> UI -> Resync -> History)

1. Open app settings and start ticket purchase.
- UI path: `Settings -> Buy Ticket`.
- API call: `POST /api/v1/billing/stripe/tickets/checkout`.
- Expected: checkout session URL is returned and browser redirects to Stripe Checkout.

2. Complete Stripe Checkout.
- Return route: `#/tickets/success`.
- Expected: frontend starts quota polling and shows success banner.

3. Confirm webhook reception and processing.
- API endpoint: `POST /api/v1/billing/stripe/webhook`.
- Expected logs include `stripe_webhook` and `ticket_purchase success`.

4. Confirm Firestore update.
- `users/{uid}.ticketSecondsBalance` increases by purchased minutes * 60.
- `users/{uid}/purchases/{session_id}` exists with pack and balance delta.

5. Confirm UI reflection.
- UI should refresh quota after success route polling.
- Billing status can be refreshed via `GET /api/v1/billing/status`.

6. Click Resync and confirm API-level refresh.
- UI action: `Resync` button.
- API call: `GET /api/v1/me`.
- Expected: refreshed quota snapshot is shown.

7. Confirm history flow remains available.
- UI route: `#/history` and `#/history/<id>`.
- Expected: history list/detail is accessible; purchase flow does not break navigation.

## Observation Points

### Stripe Dashboard
- Checkout Session status is `complete`.
- Event stream includes `checkout.session.completed` for ticket purchase.

### Cloud Run Logs
- Confirm webhook receipt and ticket processing.
- Confirm no recurring errors for the same session.

### Firestore (Admin)
- Confirm `ticketSecondsBalance` increment on user doc.
- Confirm purchase doc exists under `users/{uid}/purchases/{session_id}`.

### Frontend Console
- Confirm route handling and success diagnostics.
- Confirm no uncaught errors during purchase return and resync.

## Troubleshooting Matrix

| Symptom | Check Location | Next Action |
|---|---|---|
| Checkout button returns error before Stripe redirect | Frontend console, network response of `POST /api/v1/billing/stripe/tickets/checkout` | Inspect response detail (`pro_required`, `invalid_pack_id`, `ticket_price_not_configured`), then correct plan/pack/env mapping |
| Stripe checkout completed but quota does not change | Stripe Dashboard events, Cloud Run logs (`stripe_webhook`) | Verify webhook delivery and signature handling, then re-check session metadata (`uid`, `packId`, `minutes`) |
| Webhook called but Firestore not updated | Cloud Run logs, Firestore Admin | Check log for `ticket_purchase FAILED` or Firestore permission/transaction errors; retry after fixing root cause |
| Purchase reflected in backend but UI still stale | Browser console and network (`GET /api/v1/me`, `GET /api/v1/billing/status`) | Use Resync button, confirm fresh API response, then investigate client cache or polling timeout |
| Duplicate webhook delivery observed | Cloud Run logs and `users/{uid}/purchases/{session_id}` | Confirm idempotency path (`already_processed`) and no double increment in `ticketSecondsBalance` |
| History screen fails after purchase | Browser console, hash route behavior (`#/history`) | Validate route handling and session storage cleanup after `#/tickets/success` |

## Suggested Read-Only Verification Commands

```bash
python scripts/verify_stripe_firestore.py --uid <uid>
```

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="realtime-translator-api" AND (textPayload:"stripe_webhook" OR textPayload:"ticket_purchase")' --limit=50 --project realtime-translator-pwa-483710
```

```bash
curl -sS -H "Authorization: Bearer <ID_TOKEN>" https://realtime-translator-pwa-483710.web.app/api/v1/me | jq .
```

```bash
curl -sS -H "Authorization: Bearer <ID_TOKEN>" https://realtime-translator-pwa-483710.web.app/api/v1/billing/status | jq .
```

## Exit Criteria
- Purchase flow succeeds for a valid pack.
- Webhook event is processed and persisted once.
- Quota is visible in UI and via `/api/v1/me`.
- Resync path works.
- History routes remain functional.
