#!/usr/bin/env bash
# scripts/check_marketing_sync.sh
# Validate marketing/ and marketing_public/ are in sync.
# Exit 1 if drift detected.
#
# IMPORTANT: Independent from check_public_sync.sh.
# Never touches static/ or public/.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Guard: skip if marketing/ does not exist
if [[ ! -d "marketing" ]]; then
  echo "WARNING: marketing/ directory not found. Skipping marketing check."
  exit 0
fi

echo "=========================================="
echo "Checking marketing/ <-> marketing_public/ sync"
echo "=========================================="

drift_found=0

# ── Check output directory exists ──
if [[ ! -d "marketing_public" ]]; then
  echo "ERROR: marketing_public/ does not exist."
  echo "FIX: Run './scripts/sync_marketing.sh' first."
  exit 1
fi

# ── Validate products.json ──
echo "Validating marketing/config/products.json"
node -e "
  const p = require('./marketing/config/products.json');
  if (!Array.isArray(p.products) || p.products.length === 0) {
    throw new Error('products.json must have non-empty products array');
  }
  p.products.forEach((prod, i) => {
    if (!prod.slug || !prod.name) {
      throw new Error('products[' + i + '] missing slug or name');
    }
  });
  console.log('  OK: products.json is valid (' + p.products.length + ' product(s))');
"
if [[ $? -ne 0 ]]; then
  drift_found=1
fi

# ── Validate required output files exist ──
REQUIRED_FILES=(
  "index.html"
  "products.html"
  "privacy.html"
  "terms.html"
  "contact.html"
  "404.html"
  "robots.txt"
  "sitemap.xml"
  "css/tokens.css"
  "css/main.css"
  "css/animations.css"
  "js/observer.js"
  "js/analytics.js"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "marketing_public/$f" ]]; then
    echo "MISSING: marketing_public/$f"
    drift_found=1
  else
    echo "  OK: $f"
  fi
done

# ── Validate each active product has a generated page ──
node -e "
  const p = require('./marketing/config/products.json');
  const fs = require('fs');
  let missing = 0;
  p.products.filter(x => x.status === 'active').forEach(prod => {
    const filePath = 'marketing_public/products/' + prod.slug + '.html';
    if (!fs.existsSync(filePath)) {
      console.error('MISSING PRODUCT PAGE: ' + filePath);
      missing++;
    } else {
      console.log('  OK: products/' + prod.slug + '.html');
    }
  });
  if (missing > 0) process.exit(1);
"
if [[ $? -ne 0 ]]; then
  drift_found=1
fi

# ── Check that INCLUDE placeholders are fully resolved ──
for html_file in marketing_public/*.html marketing_public/products/*.html; do
  if [[ -f "$html_file" ]] && grep -q '<!-- INCLUDE:' "$html_file"; then
    echo "UNRESOLVED INCLUDE in $html_file"
    drift_found=1
  fi
done

# ── Check terms has #refund-policy anchor ──
if [[ -f "marketing_public/terms.html" ]]; then
  if grep -q 'id="refund-policy"' "marketing_public/terms.html"; then
    echo "  OK: terms.html has #refund-policy anchor"
  else
    echo "MISSING: #refund-policy anchor in terms.html"
    drift_found=1
  fi
fi

echo "=========================================="

if [[ $drift_found -eq 1 ]]; then
  echo ""
  echo "FIX: Run './scripts/sync_marketing.sh' to regenerate"
  echo "RULE: Never edit marketing_public/ directly. Edit marketing/ only."
  echo ""
  exit 1
fi

echo "All marketing files in sync."
exit 0
