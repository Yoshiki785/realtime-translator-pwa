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

# Validate generated pricing/legal blocks are up to date
echo "Checking generated pricing blocks"
node ./scripts/generate_pricing.js --check

require_dom_id() {
  local file="$1"
  local dom_id="$2"
  if ! rg -q "id=[\"']${dom_id}[\"']" "$file"; then
    echo "ERROR: required DOM id \"${dom_id}\" not found in ${file}" >&2
    exit 1
  fi
}

require_dom_id "static/index.html" "quotaInfo"
require_dom_id "static/index.html" "billingSection"
require_dom_id "static/index.html" "upgradeProBtn"
require_dom_id "static/index.html" "buyTicketBtn"

# Files to check
FILES=("app.js" "index.html" "styles.css" "pricing.html" "privacy.html" "terms.html" "firebase-config.js" "manifest.json" "config/pricing.json")

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
  echo "FIX: Run './scripts/sync_public.sh' to sync files"
  echo "RULE: Never edit public/ directly. Edit static/ only."
  echo ""
  exit 1
fi

echo "All files in sync."
exit 0
