#!/usr/bin/env bash
# scripts/sync_public.sh
# Sync static/ files to public/ (Firebase Hosting source)
# Source of truth: static/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Syncing static/ -> public/"
echo "=========================================="

# Files to sync
FILES=("app.js" "index.html" "styles.css" "sw.js" "manifest.json")

# Check source files exist
for f in "${FILES[@]}"; do
  if [[ ! -f "static/$f" ]]; then
    echo "ERROR: static/$f does not exist" >&2
    exit 1
  fi
done

# Copy files
copied=0
for f in "${FILES[@]}"; do
  cp "static/$f" "public/$f"
  echo "  Copied: static/$f -> public/$f"
  ((copied++))
done

# Generate build.txt for deployment verification
echo ""
echo "Generating build.txt..."
BUILD_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "public/build.txt" << EOF
BUILD_SHA=$BUILD_SHA
BUILD_TIME_UTC=$BUILD_TIME_UTC
EOF

if [[ -f "public/build.txt" ]]; then
  echo "  Generated: public/build.txt"
  cat "public/build.txt"
else
  echo "ERROR: Failed to generate public/build.txt" >&2
  exit 1
fi

echo "=========================================="
echo "Sync complete: $copied file(s) copied + build.txt generated"
echo "=========================================="
