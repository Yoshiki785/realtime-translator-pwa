#!/usr/bin/env bash
# test_downloads_route.sh - Verify /downloads/** routes to Cloud Run, not Hosting fallback
#
# This tests that the firebase.json rewrite for /downloads/** is working correctly.
# If misconfigured, /downloads/* will return index.html (the SPA fallback).
#
# Usage:
#   HOSTING_URL=https://your-app.web.app ./scripts/test_downloads_route.sh
#   API_BASE=https://your-cloudrun-url ./scripts/test_downloads_route.sh

set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

pass() {
  log "PASS: $*"
}

fail() {
  log "FAIL: $*"
  exit 1
}

# Default URLs
HOSTING_URL="${HOSTING_URL:-https://realtime-translator-pwa-483710.web.app}"
API_BASE="${API_BASE:-https://realtime-translator-api-7xgx6ra47q-an.a.run.app}"

log "=== Downloads Route Test ==="
log "Testing that /downloads/** routes correctly"
log "Hosting URL: $HOSTING_URL"
log "API Base: $API_BASE"
echo ""

# Test 1: Check /downloads/nonexistent.m4a via Hosting
# Should return 404 from Cloud Run, NOT 200 with HTML from SPA fallback
log "Test 1: GET $HOSTING_URL/downloads/nonexistent-test-file.m4a"

resp=$(curl -sS -w '\n%{http_code}' "$HOSTING_URL/downloads/nonexistent-test-file.m4a" 2>/dev/null || echo "000")
code=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')

if [[ "$code" == "404" ]]; then
  pass "Hosting returns 404 for nonexistent download file (correctly routed to Cloud Run)"
elif [[ "$code" == "200" ]]; then
  # Check if body is HTML (SPA fallback)
  if echo "$body" | grep -qi "<!DOCTYPE html"; then
    fail "Hosting returns 200 with HTML - /downloads/** is hitting SPA fallback instead of Cloud Run!"
  elif echo "$body" | grep -qi "<title>Realtime Translator"; then
    fail "Hosting returns index.html - firebase.json missing /downloads/** rewrite to Cloud Run!"
  else
    log "INFO: Hosting returns 200 with non-HTML content (unexpected but not SPA fallback)"
  fi
else
  log "INFO: Hosting returns $code (expected 404, got different code)"
fi

echo ""

# Test 2: Verify Cloud Run /downloads endpoint directly
log "Test 2: GET $API_BASE/downloads/nonexistent-test-file.m4a (direct Cloud Run)"

resp2=$(curl -sS -w '\n%{http_code}' "$API_BASE/downloads/nonexistent-test-file.m4a" 2>/dev/null || echo "000")
code2=$(echo "$resp2" | tail -1)

if [[ "$code2" == "404" || "$code2" == "400" ]]; then
  pass "Cloud Run correctly returns $code2 for nonexistent file"
else
  log "INFO: Cloud Run returns $code2 (expected 404 or 400)"
fi

echo ""

# Test 3: Check content-type of /health to verify we're hitting Cloud Run
log "Test 3: Verify /health returns JSON (confirms Cloud Run routing)"

health_resp=$(curl -sS -I "$HOSTING_URL/health" 2>/dev/null || echo "")
content_type=$(echo "$health_resp" | grep -i "content-type" | head -1 || echo "")

if echo "$content_type" | grep -qi "application/json"; then
  pass "/health returns application/json (Cloud Run routing works)"
else
  log "INFO: /health content-type: $content_type"
fi

echo ""
log "=== Test Complete ==="
log "If Test 1 failed with 'SPA fallback', the firebase.json /downloads/** rewrite is missing or incorrect."
