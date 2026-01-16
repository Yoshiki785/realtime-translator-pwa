#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "FAIL: $*"
  exit 1
}

require_python() {
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    fail "python3 is required for JSON parsing"
  fi
}

if [[ -z "${APP_BASE_URL:-}" ]]; then
  fail "APP_BASE_URL is required (Cloud Run base URL)"
fi

if [[ -z "${ID_TOKEN:-}" ]]; then
  fail "ID_TOKEN is required (Firebase ID token)"
fi

require_python

AUTH_HEADER="Authorization: Bearer $ID_TOKEN"
INFO_HEADER="Accept: application/json"

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  local headers=("$INFO_HEADER" "$@")
  local curl_args=(-sS -w '\n%{http_code}' -X "$method")
  for header in "${headers[@]}"; do
    curl_args+=(-H "$header")
  done
  if [[ -n "$body" ]]; then
    curl_args+=(-H 'Content-Type: application/json' --data "$body")
  fi
  curl_args+=("$url")

  local output
  output=$(curl "${curl_args[@]}" 2>/dev/null) || true
  if [[ -z "$output" ]]; then
    CURL_BODY=""
    CURL_CODE="000"
    return
  fi
  CURL_CODE=$(echo "$output" | tail -1)
  CURL_BODY=$(echo "$output" | sed '$d')
}

json_get() {
  local json="$1"
  local key="$2"
  echo "$json" | "$PYTHON_BIN" -c 'import json,sys
data=json.load(sys.stdin)
key=sys.argv[1]
value=data.get(key)
if value is None:
    raise SystemExit(1)
print(value)
' "$key"
}

pretty_json() {
  echo "$1" | "$PYTHON_BIN" -m json.tool 2>/dev/null || echo "$1"
}

log "Usage (before): GET $APP_BASE_URL/api/v1/usage/remaining"
CURL_BODY=""
CURL_CODE=""
curl_json GET "$APP_BASE_URL/api/v1/usage/remaining" "" "$AUTH_HEADER"
if [[ "$CURL_CODE" != "200" ]]; then
  log "Response: $(pretty_json "$CURL_BODY")"
  fail "usage/remaining returned $CURL_CODE"
fi
log "Usage before: $(pretty_json "$CURL_BODY")"

log "Create job: POST $APP_BASE_URL/api/v1/jobs/create"
CURL_BODY=""
CURL_CODE=""
curl_json POST "$APP_BASE_URL/api/v1/jobs/create" "" "$AUTH_HEADER"
if [[ "$CURL_CODE" == "402" ]]; then
  log "Quota exhausted (expected HTTP 402)."
  log "Response: $(pretty_json "$CURL_BODY")"
  exit 1
fi
if [[ "$CURL_CODE" != "200" ]]; then
  log "Response: $(pretty_json "$CURL_BODY")"
  fail "jobs/create returned $CURL_CODE"
fi

job_id=$(json_get "$CURL_BODY" "jobId") || fail "jobs/create response missing jobId"
log "Job created: $job_id"

complete_payload=$(printf '{"jobId":"%s","audioSeconds":1}' "$job_id")
log "Complete job: POST $APP_BASE_URL/api/v1/jobs/complete"
CURL_BODY=""
CURL_CODE=""
curl_json POST "$APP_BASE_URL/api/v1/jobs/complete" "$complete_payload" "$AUTH_HEADER"
if [[ "$CURL_CODE" != "200" ]]; then
  log "Response: $(pretty_json "$CURL_BODY")"
  fail "jobs/complete returned $CURL_CODE"
fi
log "Job completed: $(pretty_json "$CURL_BODY")"

log "Usage (after): GET $APP_BASE_URL/api/v1/usage/remaining"
CURL_BODY=""
CURL_CODE=""
curl_json GET "$APP_BASE_URL/api/v1/usage/remaining" "" "$AUTH_HEADER"
if [[ "$CURL_CODE" != "200" ]]; then
  log "Response: $(pretty_json "$CURL_BODY")"
  fail "usage/remaining returned $CURL_CODE"
fi
log "Usage after: $(pretty_json "$CURL_BODY")"

if [[ -n "${ADMIN_BEARER_TOKEN:-}" ]]; then
  log "Cleanup: POST $APP_BASE_URL/api/v1/admin/cleanup (Bearer)"
  CURL_BODY=""
  CURL_CODE=""
  curl_json POST "$APP_BASE_URL/api/v1/admin/cleanup" "" "Authorization: Bearer $ADMIN_BEARER_TOKEN"
  log "Cleanup response: $(pretty_json "$CURL_BODY")"
elif [[ -n "${ADMIN_CLEANUP_TOKEN:-}" ]]; then
  log "Cleanup: POST $APP_BASE_URL/api/v1/admin/cleanup (x-admin-token)"
  CURL_BODY=""
  CURL_CODE=""
  curl_json POST "$APP_BASE_URL/api/v1/admin/cleanup" "" "x-admin-token: $ADMIN_CLEANUP_TOKEN"
  log "Cleanup response: $(pretty_json "$CURL_BODY")"
else
  log "Cleanup skipped (ADMIN_BEARER_TOKEN/ADMIN_CLEANUP_TOKEN not set)"
fi

log "PASS: e2e completed"
