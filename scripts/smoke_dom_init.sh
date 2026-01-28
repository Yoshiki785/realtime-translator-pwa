#!/usr/bin/env bash
# scripts/smoke_dom_init.sh
# Minimal smoke test to ensure critical UI elements and event handlers are present
# This catches issues where login/core functionality would be broken

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

HTML_FILE="$PROJECT_ROOT/static/index.html"
JS_FILE="$PROJECT_ROOT/static/app.js"

echo "=========================================="
echo "Smoke Test: DOM Initialization Integrity"
echo "=========================================="

FAILURES=0

# Helper function
check_exists() {
  local file="$1"
  local pattern="$2"
  local description="$3"

  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "  ✓ $description"
    return 0
  else
    echo "  ✗ FAIL: $description"
    return 1
  fi
}

echo ""
echo "[1] Checking critical HTML elements exist..."
echo "    File: $HTML_FILE"

# Login button
check_exists "$HTML_FILE" 'id="loginBtn"' "loginBtn element exists" || FAILURES=$((FAILURES + 1))

# Logout button
check_exists "$HTML_FILE" 'id="logoutBtn"' "logoutBtn element exists" || FAILURES=$((FAILURES + 1))

# Start/Stop buttons
check_exists "$HTML_FILE" 'id="startBtn"' "startBtn element exists" || FAILURES=$((FAILURES + 1))
check_exists "$HTML_FILE" 'id="stopBtn"' "stopBtn element exists" || FAILURES=$((FAILURES + 1))

# Settings
check_exists "$HTML_FILE" 'id="settingsBtn"' "settingsBtn element exists" || FAILURES=$((FAILURES + 1))
check_exists "$HTML_FILE" 'id="settingsModal"' "settingsModal element exists" || FAILURES=$((FAILURES + 1))

echo ""
echo "[2] Checking event handlers are registered in app.js..."
echo "    File: $JS_FILE"

# Login button event handler
check_exists "$JS_FILE" 'els.loginBtn.*addEventListener' "loginBtn has event handler" || FAILURES=$((FAILURES + 1))

# Logout button event handler
check_exists "$JS_FILE" 'els.logoutBtn.*addEventListener' "logoutBtn has event handler" || FAILURES=$((FAILURES + 1))

# Start/Stop handlers
check_exists "$JS_FILE" "els.start.*addEventListener.*click.*start" "start button has handler" || FAILURES=$((FAILURES + 1))
check_exists "$JS_FILE" "els.stop.*addEventListener.*click.*stop" "stop button has handler" || FAILURES=$((FAILURES + 1))

echo ""
echo "[3] Checking initialization structure..."
echo "    File: $JS_FILE"

# initCritical function exists
check_exists "$JS_FILE" "function initCritical()" "initCritical() function exists" || FAILURES=$((FAILURES + 1))

# initNonCritical function exists
check_exists "$JS_FILE" "function initNonCritical()" "initNonCritical() function exists" || FAILURES=$((FAILURES + 1))

# initCritical is called with try/catch
if grep -q "try.*{" "$JS_FILE" && grep -q "initCritical()" "$JS_FILE"; then
  echo "  ✓ initCritical() is called"
else
  echo "  ✗ FAIL: initCritical() call not found"
  FAILURES=$((FAILURES + 1))
fi

# initNonCritical is called with try/catch
if grep -q "try.*{" "$JS_FILE" && grep -q "initNonCritical()" "$JS_FILE"; then
  echo "  ✓ initNonCritical() is called"
else
  echo "  ✗ FAIL: initNonCritical() call not found"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "[4] Checking non-critical features are protected..."
echo "    File: $JS_FILE"

# fetchBuildSha has internal try/catch
if grep -A5 "async function fetchBuildSha" "$JS_FILE" | grep -q "try"; then
  echo "  ✓ fetchBuildSha() has try/catch protection"
else
  echo "  ✗ FAIL: fetchBuildSha() lacks try/catch protection"
  FAILURES=$((FAILURES + 1))
fi

# SW registration is wrapped in try/catch
if grep -B2 -A2 "serviceWorker.register" "$JS_FILE" | grep -q "try\|catch"; then
  echo "  ✓ SW registration has try/catch protection"
else
  echo "  ✗ FAIL: SW registration lacks try/catch protection"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "[5] Checking function declarations (TDZ-safe)..."
echo "    File: $JS_FILE"

# showUpdateBanner uses function declaration (not const/let)
if grep -q "function showUpdateBanner(" "$JS_FILE"; then
  echo "  ✓ showUpdateBanner uses function declaration (TDZ-safe)"
else
  echo "  ✗ FAIL: showUpdateBanner should use function declaration"
  FAILURES=$((FAILURES + 1))
fi

# fetchBuildSha uses async function declaration (not const/let)
if grep -q "async function fetchBuildSha(" "$JS_FILE"; then
  echo "  ✓ fetchBuildSha uses async function declaration (TDZ-safe)"
else
  echo "  ✗ FAIL: fetchBuildSha should use async function declaration"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "=========================================="

if [[ $FAILURES -gt 0 ]]; then
  echo "Smoke Test: FAIL ($FAILURES issue(s) found)"
  echo ""
  echo "These checks ensure that login and core UI will always work."
  echo "Fix the issues above before deploying."
  exit 1
fi

echo "Smoke Test: PASS"
echo "All critical UI elements and event handlers are present."
exit 0
