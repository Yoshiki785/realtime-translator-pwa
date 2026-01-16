#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "FAIL: $*"
  exit 1
}

if [[ -z "${API_BASE:-}" ]]; then
  fail "API_BASE env var is required"
fi

INFO_HEADER=("Accept: application/json")

require_python() {
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    fail "python3 is required for JSON parsing"
  fi
}

check_health() {
  require_python
  curl -fsS -H "${INFO_HEADER[0]}" "$API_BASE/health" | "$PYTHON_BIN" -c 'import sys,json
try:
    d=json.load(sys.stdin)
except json.JSONDecodeError as exc:
    print(f"invalid json: {exc}")
    raise SystemExit(1)
if d.get("ok") is not True:
    print("ok flag not true")
    raise SystemExit(1)' || fail "health response missing ok=true"
}

extract_job_id() {
  require_python
  local json="$1"
  echo "$json" | "$PYTHON_BIN" -c '
import json,sys
data=json.load(sys.stdin)
job_id = data.get("jobId") or data.get("job_id")
if not job_id:
    print("", end="")
    sys.exit(1)
print(job_id)
'
}

# curl_json: Makes HTTP request and sets C_URL_CODE and C_URL_BODY globals
# Usage: curl_json METHOD URL [BODY] [HEADERS...]
curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  local headers=("${INFO_HEADER[@]}")
  while (($#)); do
    headers+=("$1")
    shift
  done
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
    C_URL_BODY=""
    C_URL_CODE="000"
    return
  fi
  # Last line is HTTP code, everything before is body
  C_URL_CODE=$(echo "$output" | tail -1)
  C_URL_BODY=$(echo "$output" | sed '$d')
}

# Step 1: health check
# NOTE: Using /health instead of /healthz (Cloud Run reserves paths ending with 'z')
log "Checking $API_BASE/health"
check_health

if [[ -n "${TOKEN:-}" ]]; then
  AUTH_HEADER="Authorization: Bearer $TOKEN"
  log "Running authenticated checks"

  # Initialize globals for set -u compatibility
  C_URL_BODY=""
  C_URL_CODE=""

  curl_json GET "$API_BASE/api/v1/me" "" "$AUTH_HEADER"
  if [[ "$C_URL_CODE" != "200" ]]; then
    fail "GET /api/v1/me returned $C_URL_CODE"
  fi

  curl_json POST "$API_BASE/api/v1/jobs/create" "" "$AUTH_HEADER"
  if [[ "$C_URL_CODE" != "200" ]]; then
    fail "First jobs/create returned $C_URL_CODE"
  fi
  job_id=$(extract_job_id "$C_URL_BODY") || fail "jobs/create response missing jobId"

  curl_json POST "$API_BASE/api/v1/jobs/create" "" "$AUTH_HEADER"
  if [[ "$C_URL_CODE" != "409" ]]; then
    fail "Second jobs/create should 409, got $C_URL_CODE"
  fi

  complete_payload=$(printf '{"jobId":"%s","audioSeconds":0}' "$job_id")
  curl_json POST "$API_BASE/api/v1/jobs/complete" "$complete_payload" "$AUTH_HEADER"
  if [[ "$C_URL_CODE" != "200" ]]; then
    fail "jobs/complete returned $C_URL_CODE"
  fi
fi

log "PASS: smoke check completed"
