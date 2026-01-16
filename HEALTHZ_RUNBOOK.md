# HEALTHZ_RUNBOOK

## Goal
Expose `/health` on the FastAPI backend (unauthenticated JSON) and document safe redeploy + verification steps for Cloud Run.

> **Cloud Run Known Issue**: Paths ending with `z` (e.g., `/healthz`) are reserved by Cloud Run infrastructure and return Google's default 404 page. Use `/health` instead.

## Steps
1. **S0** – Init: confirm AI_WORKFLOW rules, create HEALTHZ_STATE/RUNBOOK.
2. **S1** – Backend: ensure `/health` returns `{ok, service, version, time}` without secrets.
3. **S2** – Docs: update `ops/SMOKE_CHECK.md` if necessary (Cloud Run URL should respond now).
4. **S3** – Redeploy guidance: list `gcloud run deploy` command (see DEPLOY.md).
5. **S4** – Verification commands (`curl` + smoke script).

## S1 backend status
- Existing implementation in `app.py` already provides `SERVICE_NAME` (default `realtime-translator-api`) and `APP_VERSION` fallback (`APP_VERSION` env → `COMMIT_SHA` → `local`).
- `/health` returns `{ "ok": true, "service": SERVICE_NAME, "version": APP_VERSION, "time": <UTC ISO8601> }` and is unauthenticated.

## Pending work
- Update docs + instructions (S2–S4 below).

## S2 docs
- `ops/SMOKE_CHECK.md` updated to prefer Cloud Run URL (`https://realtime-translator-api-853238768850.asia-northeast1.run.app`) for `/health`.
- Example commands now default to Cloud Run base; Hosting fallback note retained.

## S3 redeploy guidance
- Cloud Run deploy command (based on `DEPLOY.md`):
  ```bash
  gcloud run deploy realtime-translator-api \
    --image asia-northeast1-docker.pkg.dev/$PROJECT_ID/realtime-translator/realtime-translator-api:latest \
    --platform managed \
    --region asia-northeast1 \
    --allow-unauthenticated \
    --set-env-vars ENV=production,GCS_BUCKET=$GCS_BUCKET,STRIPE_PRO_PRICE_ID=price_LIVE_PRO_PRICE_ID \
    --set-secrets OPENAI_API_KEY=OPENAI_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest \
    --memory 512Mi --cpu 1 --timeout 300 --max-instances 10 --min-instances 0
  ```
  (Adjust image path/project env vars per `DEPLOY.md`.)

## S4 verification
- After deploy:
  ```bash
  API_BASE="https://realtime-translator-api-853238768850.asia-northeast1.run.app"
  curl -i "$API_BASE/health"
  API_BASE="$API_BASE" ./scripts/smoke_check.sh
  ```
- Troubleshooting: 404 means older revision/incorrect base; 403 indicates IAM restriction; 5xx hints application error (check Cloud Run logs).
