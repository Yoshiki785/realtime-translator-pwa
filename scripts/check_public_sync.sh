#!/usr/bin/env bash
# scripts/check_public_sync.sh
# Check that static/ and public/ are in sync
# Exit 1 if drift detected

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Checking static/ <-> public/ sync"
echo "=========================================="

# Files to check (build.txt is excluded as it's generated during sync)
FILES=("app.js" "index.html" "styles.css" "sw.js" "manifest.json")

drift_found=0

for f in "${FILES[@]}"; do
  if [[ ! -f "static/$f" ]]; then
    echo "ERROR: static/$f does not exist" >&2
    exit 1
  fi
  if [[ ! -f "public/$f" ]]; then
    echo "ERROR: public/$f does not exist" >&2
    exit 1
  fi

  if ! diff -q "static/$f" "public/$f" > /dev/null 2>&1; then
    echo "DRIFT DETECTED: static/$f != public/$f"
    drift_found=1
  else
    echo "  OK: $f is in sync"
  fi
done

echo "=========================================="

if [[ $drift_found -eq 1 ]]; then
  echo ""
  echo "DRIFT SUMMARY: The following files in public/ do not match static/:"
  for f in "${FILES[@]}"; do
    if ! diff -q "static/$f" "public/$f" > /dev/null 2>&1; then
      echo "  - $f"
    fi
  done
  echo ""
  echo "FIX: Run './scripts/sync_public.sh' to sync files"
  echo "RULE: Never edit public/ directly. Edit static/ only."
  echo ""
  exit 1
fi

echo "All files in sync."

# Additional quality checks (non-blocking by default, set STRICT_CHECKS=1 to enforce)
echo ""
echo "=========================================="
echo "Running additional quality checks..."
echo "=========================================="

QUALITY_FAILURES=0

# TDZ check
if [[ -x "$SCRIPT_DIR/verify_no_tdz.sh" ]]; then
  echo ""
  if "$SCRIPT_DIR/verify_no_tdz.sh"; then
    echo ""
  else
    QUALITY_FAILURES=$((QUALITY_FAILURES + 1))
  fi
fi

# Smoke test
if [[ -x "$SCRIPT_DIR/smoke_dom_init.sh" ]]; then
  echo ""
  if "$SCRIPT_DIR/smoke_dom_init.sh"; then
    echo ""
  else
    QUALITY_FAILURES=$((QUALITY_FAILURES + 1))
  fi
fi

# Sprint 2 Stop-flow smoke test (only when STRICT_CHECKS=1)
if [[ "${STRICT_CHECKS:-0}" == "1" ]] && [[ -x "$SCRIPT_DIR/smoke_stopflow.sh" ]]; then
  echo ""
  if "$SCRIPT_DIR/smoke_stopflow.sh"; then
    echo ""
  else
    QUALITY_FAILURES=$((QUALITY_FAILURES + 1))
  fi
elif [[ -x "$SCRIPT_DIR/smoke_stopflow.sh" ]]; then
  echo ""
  echo "Skipping smoke_stopflow.sh (set STRICT_CHECKS=1 to enable)"
fi

if [[ $QUALITY_FAILURES -gt 0 ]]; then
  echo "=========================================="
  echo "Quality checks: $QUALITY_FAILURES issue(s) found"
  echo "=========================================="
  if [[ "${STRICT_CHECKS:-0}" == "1" ]]; then
    echo "STRICT_CHECKS=1: Failing due to quality issues"
    exit 1
  else
    echo "WARNING: Quality issues found but STRICT_CHECKS not enabled"
    echo "Set STRICT_CHECKS=1 to enforce these checks"
  fi
fi

echo "=========================================="
echo "All checks passed."
exit 0
