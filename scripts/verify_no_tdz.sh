#!/usr/bin/env bash
# scripts/verify_no_tdz.sh
# Detect potential TDZ (Temporal Dead Zone) issues in DOMContentLoaded callbacks
# Exit 1 if a function is called before its definition and uses const/let syntax

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_FILE="${1:-$PROJECT_ROOT/static/app.js}"

echo "=========================================="
echo "Checking for TDZ issues in: $TARGET_FILE"
echo "=========================================="

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "ERROR: File not found: $TARGET_FILE" >&2
  exit 1
fi

# Extract function names called within DOMContentLoaded
# Look for function calls like: functionName() or functionName(args)
# Focus on calls that appear before their definitions

ISSUES_FOUND=0

# Get line numbers for DOMContentLoaded block
DOM_START=$(grep -n "document.addEventListener('DOMContentLoaded'" "$TARGET_FILE" | head -1 | cut -d: -f1)

if [[ -z "$DOM_START" ]]; then
  echo "INFO: No DOMContentLoaded found in $TARGET_FILE"
  echo "=========================================="
  echo "TDZ check: PASS (no DOMContentLoaded)"
  exit 0
fi

echo "DOMContentLoaded starts at line: $DOM_START"

# Extract function calls that look like: someName() or someName(
# Exclude common built-ins and method calls (those with . before them)
# Focus on standalone function calls

# Get all function definitions using const/let pattern: const/let name = (...) => or const/let name = async (
CONST_LET_FUNCS=$(grep -n "^\s*\(const\|let\)\s\+\([a-zA-Z_][a-zA-Z0-9_]*\)\s*=\s*\(async\s\+\)\?(" "$TARGET_FILE" 2>/dev/null | \
  sed -E 's/^([0-9]+):\s*(const|let)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=.*/\1:\3/' || true)

# Get all function definitions using function declaration: function name( or async function name(
FUNC_DECL_FUNCS=$(grep -n "^\s*\(async\s\+\)\?function\s\+\([a-zA-Z_][a-zA-Z0-9_]*\)\s*(" "$TARGET_FILE" 2>/dev/null | \
  sed -E 's/^([0-9]+):\s*(async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*/\1:\3/' || true)

echo ""
echo "const/let function expressions found:"
echo "$CONST_LET_FUNCS" | head -10 || echo "  (none)"
echo ""

# For each const/let function, check if it's called before its definition line
while IFS=: read -r def_line func_name; do
  [[ -z "$func_name" ]] && continue

  # Find the first call to this function (pattern: funcName( but not .funcName()
  FIRST_CALL_LINE=$(grep -n "[^.a-zA-Z0-9_]${func_name}(" "$TARGET_FILE" 2>/dev/null | \
    grep -v "const\s\+${func_name}\s*=" | \
    grep -v "let\s\+${func_name}\s*=" | \
    grep -v "function\s\+${func_name}\s*(" | \
    head -1 | cut -d: -f1 || true)

  if [[ -n "$FIRST_CALL_LINE" ]] && [[ "$FIRST_CALL_LINE" -lt "$def_line" ]]; then
    # Check if call is within DOMContentLoaded (after DOM_START)
    if [[ "$FIRST_CALL_LINE" -ge "$DOM_START" ]]; then
      echo "TDZ RISK: '$func_name' called at line $FIRST_CALL_LINE, defined at line $def_line"
      echo "  -> const/let functions are NOT hoisted; this may cause ReferenceError"
      ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
  fi
done <<< "$CONST_LET_FUNCS"

echo ""
echo "=========================================="

if [[ $ISSUES_FOUND -gt 0 ]]; then
  echo "TDZ check: FAIL ($ISSUES_FOUND potential issue(s) found)"
  echo ""
  echo "FIX: Convert 'const name = () => {}' to 'function name() {}'"
  echo "     or 'const name = async () => {}' to 'async function name() {}'"
  echo "     Function declarations are hoisted and avoid TDZ issues."
  echo ""
  exit 1
fi

echo "TDZ check: PASS"
exit 0
