#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="realtime-translator-pwa-483710"
REGION="asia-northeast1"
SERVICE_NAME="realtime-translator-api"

if [[ -z "${API_BASE:-}" ]]; then
  echo "API_BASE is required." >&2
  exit 1
fi

if [[ -z "${ID_TOKEN:-}" ]]; then
  echo "ID_TOKEN is required. Run: source scripts/get_id_token.sh" >&2
  exit 1
fi

header_file="$(mktemp)"
body_file="$(mktemp)"
cleanup() {
  rm -f "$header_file" "$body_file"
}
trap cleanup EXIT

status="$(curl -sS -D "$header_file" -o "$body_file" -w "%{http_code}" \
  -X POST "${API_BASE}/token" \
  -H "Authorization: Bearer ${ID_TOKEN}")"

echo "HTTP status: ${status}"
echo "Response headers (first 10 lines):"
head -n 10 "$header_file"
echo "Response body (redacted):"
if [[ -s "$body_file" ]]; then
  sed -E \
    -e 's/("value"\s*:\s*")[^"]+/\1[REDACTED]/g' \
    -e 's/("client_secret"\s*:\s*")[^"]+/\1[REDACTED]/g' \
    "$body_file"
else
  echo "(empty)"
fi

echo "Cloud Run logs (last 5m, filtered):"
if command -v gcloud >/dev/null 2>&1; then
  gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND resource.labels.location=\"${REGION}\"" \
    --project "${PROJECT_ID}" \
    --limit 200 \
    --freshness 5m \
    --format "value(textPayload)" \
    | egrep -i 'openai|401|unauthorized|client_secret|client_secrets' || true
else
  echo "gcloud not found; skip log check." >&2
fi

if [[ "$status" == "200" ]]; then
  exit 0
fi
exit 1
