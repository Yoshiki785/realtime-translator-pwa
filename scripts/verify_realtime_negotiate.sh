#!/bin/bash
#
# verify_realtime_negotiate.sh
# CI/CD 検証用：Realtime negotiate の仕様が正しいことを確認
#
# 期待仕様 (OpenAI Realtime GA WebRTC spec):
# - URL: POST /v1/realtime/calls
# - Content-Type: application/sdp
# - Body: raw SDP string (offerSdp)
#
# 禁止事項:
# - /v1/realtime?model=... は negotiate で使わない（WebSocket用）
# - FormData/JSON は negotiate で使わない
#
# 維持すべき機能:
# - Glossary (parseGlossary, buildSessionInstructions)
# - Takeover (showTakeoverDialog, force_takeover)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# チェック対象ファイル（両方チェック）
TARGETS=(
  "${PROJECT_ROOT}/static/app.js"
  "${PROJECT_ROOT}/public/app.js"
)

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_ERRORS=0

# 単一ファイルをチェックする関数
check_file() {
  local APP_JS="$1"
  local FILE_NAME
  FILE_NAME=$(basename "$(dirname "$APP_JS")")/$(basename "$APP_JS")
  local ERRORS=0

  echo ""
  echo -e "${BLUE}=========================================="
  echo "Checking: $FILE_NAME"
  echo -e "==========================================${NC}"

  if [ ! -f "$APP_JS" ]; then
    echo -e "${RED}ERROR: $APP_JS not found${NC}"
    return 1
  fi

  # 1. Check REALTIME_CALLS_URL is defined correctly
  echo -n "1. REALTIME_CALLS_URL = '.../v1/realtime/calls'... "
  if grep -Eq "REALTIME_CALLS_URL\s*=\s*['\"]https://api.openai.com/v1/realtime/calls['\"]" "$APP_JS"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Get negotiate function block for exclusion checks
  local NEGOTIATE_START
  NEGOTIATE_START=$(grep -n "const negotiate\s*=" "$APP_JS" | head -1 | cut -d: -f1 || echo "")
  local NEGOTIATE_BLOCK=""

  if [ -n "$NEGOTIATE_START" ]; then
    local NEGOTIATE_END_LINE
    NEGOTIATE_END_LINE=$(grep -n "const startConnectionAttempt" "$APP_JS" | head -1 | cut -d: -f1 || echo "")
    if [ -n "$NEGOTIATE_END_LINE" ] && [ "$NEGOTIATE_END_LINE" -gt "$NEGOTIATE_START" ]; then
      local NEGOTIATE_END=$((NEGOTIATE_END_LINE - 1))
      NEGOTIATE_BLOCK=$(sed -n "${NEGOTIATE_START},${NEGOTIATE_END}p" "$APP_JS" \
        | sed -e 's|//.*$||' -e '/\/\*/,/\*\//d' || echo "")
    else
      local NEGOTIATE_END=$((NEGOTIATE_START + 220))
      NEGOTIATE_BLOCK=$(sed -n "${NEGOTIATE_START},${NEGOTIATE_END}p" "$APP_JS" \
        | sed -e 's|//.*$||' -e '/\/\*/,/\*\//d' || echo "")
    fi
  fi

  # 2. Check negotiate fetch uses REALTIME_CALLS_URL
  echo -n "2. negotiate fetch uses REALTIME_CALLS_URL... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eq "fetch\s*\(\s*REALTIME_CALLS_URL"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 3. Check Content-Type: application/sdp in negotiate
  echo -n "3. Content-Type: 'application/sdp'... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eq "Content-Type['\"]\s*:\s*['\"]application/sdp['\"]"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 4. Check body is offerSdp (raw SDP)
  echo -n "4. body: offerSdp (raw SDP)... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eq "body\s*:\s*offerSdp"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 5. Check FormData is NOT used in negotiate code (exclude comments)
  echo -n "5. No FormData/multipart in negotiate... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eiq "FormData|multipart/form-data"; then
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  elif [ -n "$NEGOTIATE_START" ]; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL (negotiate not found)${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 6. Check application/json is NOT used in negotiate code (exclude comments)
  echo -n "6. No application/json in negotiate... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eiq "application/json"; then
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  elif [ -n "$NEGOTIATE_START" ]; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL (negotiate not found)${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 7. Check /v1/realtime?model= is NOT used in negotiate fetch (exclude comments)
  echo -n "7. No /v1/realtime?model= in negotiate... "
  if [ -n "$NEGOTIATE_START" ] && echo "$NEGOTIATE_BLOCK" | grep -Eq "realtime\?model=|REALTIME_BASE_URL[^\n]*\?model="; then
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  elif [ -n "$NEGOTIATE_START" ]; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL (negotiate not found)${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 8. Check Glossary functions exist
  echo -n "8. Glossary: parseGlossary & buildSessionInstructions... "
  if grep -q "const parseGlossary" "$APP_JS" && grep -q "const buildSessionInstructions" "$APP_JS"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # 9. Check Takeover functions exist
  echo -n "9. Takeover: showTakeoverDialog & force_takeover... "
  if grep -q "showTakeoverDialog" "$APP_JS" && grep -q "force_takeover" "$APP_JS"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  echo ""
  if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}$FILE_NAME: All 9 checks passed!${NC}"
  else
    echo -e "${RED}$FILE_NAME: $ERRORS check(s) failed!${NC}"
  fi

  return $ERRORS
}

# メイン処理
echo "=========================================="
echo "Realtime Negotiate Specification Check"
echo "=========================================="
echo ""
echo "Verifying OpenAI Realtime WebRTC negotiate spec:"
echo "  - URL: POST /v1/realtime/calls"
echo "  - Content-Type: application/sdp"
echo "  - Body: raw SDP (offerSdp)"
echo "  - No FormData/JSON/realtime?model="
echo "  - Glossary & Takeover maintained"

# 各ファイルをチェック
for TARGET in "${TARGETS[@]}"; do
  if check_file "$TARGET"; then
    :
  else
    FILE_ERRORS=$?
    TOTAL_ERRORS=$((TOTAL_ERRORS + FILE_ERRORS))
  fi
done

# static/app.js と public/app.js の同一性チェック
echo ""
echo -e "${BLUE}=========================================="
echo "File Sync Check"
echo -e "==========================================${NC}"
echo -n "static/app.js == public/app.js... "
if diff -q "${PROJECT_ROOT}/static/app.js" "${PROJECT_ROOT}/public/app.js" > /dev/null 2>&1; then
  echo -e "${GREEN}OK (identical)${NC}"
else
  echo -e "${YELLOW}WARN (files differ - run: cp static/app.js public/app.js)${NC}"
fi

# 最終結果
echo ""
echo "=========================================="
if [ $TOTAL_ERRORS -eq 0 ]; then
  echo -e "${GREEN}SUCCESS: All checks passed!${NC}"
  echo ""
  echo "Negotiate spec verified:"
  echo "  - fetch(REALTIME_CALLS_URL, { headers: { 'Content-Type': 'application/sdp' }, body: offerSdp })"
  echo "  - No forbidden patterns (FormData, JSON, ?model=)"
  echo "  - Glossary & Takeover features maintained"
  exit 0
else
  echo -e "${RED}FAILURE: $TOTAL_ERRORS total error(s)${NC}"
  echo ""
  echo "Expected negotiate spec:"
  echo "  - REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'"
  echo "  - Content-Type: application/sdp"
  echo "  - body: offerSdp (raw SDP string)"
  exit 1
fi
