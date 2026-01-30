#!/usr/bin/env bash
# e2e_smoke.sh - MVP Launch Smoke Test
# Usage: APP_BASE_URL=https://your-cloudrun-url ./scripts/e2e_smoke.sh
#        Or: HOSTING_URL=https://your-hosting-url ./scripts/e2e_smoke.sh

set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

pass() {
  log "✓ PASS: $*"
}

fail() {
  log "✗ FAIL: $*"
  FAILED=1
}

FAILED=0
HOSTING_URL="${HOSTING_URL:-https://realtime-translator-pwa-483710.web.app}"
APP_BASE_URL="${APP_BASE_URL:-https://realtime-translator-api-668693762495.asia-northeast1.run.app}"

log "=== MVP Launch Smoke Test ==="
log "Hosting URL: $HOSTING_URL"
log "API Base URL: $APP_BASE_URL"
echo ""

# ========== 1. Health Check ==========
log "--- 1. Health Check ---"
HEALTH_RESP=$(curl -sS -w '\n%{http_code}' "$APP_BASE_URL/health" 2>/dev/null || echo "000")
HEALTH_CODE=$(echo "$HEALTH_RESP" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESP" | sed '$d')

if [[ "$HEALTH_CODE" == "200" ]]; then
  pass "/health returned 200"
  log "Response: $HEALTH_BODY"

  # Check for required fields
  if echo "$HEALTH_BODY" | grep -q '"ok"'; then
    pass "/health contains 'ok' field"
  else
    fail "/health missing 'ok' field"
  fi

  if echo "$HEALTH_BODY" | grep -q '"version"'; then
    pass "/health contains 'version' field"
  else
    fail "/health missing 'version' field"
  fi
else
  fail "/health returned $HEALTH_CODE (expected 200)"
fi

echo ""

# ========== 2. Frontend Pages ==========
log "--- 2. Frontend Pages ---"

check_page() {
  local name="$1"
  local url="$2"
  local expected_content="${3:-}"

  local resp=$(curl -sS -w '\n%{http_code}' "$url" 2>/dev/null || echo "000")
  local code=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')

  if [[ "$code" == "200" ]]; then
    pass "$name returned 200"
    if [[ -n "$expected_content" ]]; then
      if echo "$body" | grep -qi "$expected_content"; then
        pass "$name contains expected content"
      else
        fail "$name missing expected content: $expected_content"
      fi
    fi
  else
    fail "$name returned $code (expected 200)"
  fi
}

# Main page
check_page "index.html" "$HOSTING_URL/" "Realtime Translator"

# Privacy page
check_page "privacy.html" "$HOSTING_URL/privacy.html" "プライバシーポリシー"

# Terms page
check_page "terms.html" "$HOSTING_URL/terms.html" "利用規約"

echo ""

# ========== 3. API Endpoints (No Auth) ==========
log "--- 3. API Endpoints (Unauthenticated) ---"

# These should return 401 or 403 without auth, not 500
check_api_unauth() {
  local name="$1"
  local method="$2"
  local url="$3"

  local resp=$(curl -sS -w '\n%{http_code}' -X "$method" "$url" 2>/dev/null || echo "000")
  local code=$(echo "$resp" | tail -1)

  # Without auth, we expect 401, 403, or 422 - NOT 500
  if [[ "$code" == "401" || "$code" == "403" || "$code" == "422" ]]; then
    pass "$name properly rejects unauthenticated requests ($code)"
  elif [[ "$code" == "500" ]]; then
    fail "$name returns 500 (server error) - should be 401/403"
  else
    log "INFO: $name returned $code"
  fi
}

check_api_unauth "GET /api/v1/me" GET "$APP_BASE_URL/api/v1/me"
check_api_unauth "POST /api/v1/jobs/create" POST "$APP_BASE_URL/api/v1/jobs/create"

echo ""

# ========== 4. Static Assets ==========
log "--- 4. Static Assets ---"

check_asset() {
  local name="$1"
  local url="$2"

  local resp=$(curl -sS -w '%{http_code}' -o /dev/null "$url" 2>/dev/null || echo "000")

  if [[ "$resp" == "200" ]]; then
    pass "$name accessible"
  else
    fail "$name returned $resp (expected 200)"
  fi
}

check_asset "app.js" "$HOSTING_URL/app.js"
check_asset "styles.css" "$HOSTING_URL/styles.css"
check_asset "manifest.json" "$HOSTING_URL/manifest.json"

echo ""

# ========== Summary ==========
log "=== Summary ==="
if [[ "$FAILED" == "0" ]]; then
  log "All smoke tests PASSED"
  exit 0
else
  log "Some tests FAILED - review output above"
  exit 1
fi
