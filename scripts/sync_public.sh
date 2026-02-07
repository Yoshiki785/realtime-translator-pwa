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

# Generate pricing/legal blocks from single source config
echo "Generating pricing blocks from static/config/pricing.json"
node ./scripts/generate_pricing.js

# Generate build timestamp
BUILD_TIME=$(date +%Y%m%d%H%M%S)
echo "Build timestamp: $BUILD_TIME"

# Files to sync (simple copy)
FILES=("app.js" "index.html" "styles.css" "pricing.html" "privacy.html" "terms.html" "firebase-config.js" "manifest.json")

# Files that need BUILD_TIME replacement
FILES_WITH_BUILD_TIME=("sw.js")

# Check source files exist
for f in "${FILES[@]}" "${FILES_WITH_BUILD_TIME[@]}"; do
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

# Copy binary assets (icons)
for icon in static/icon-*.png; do
  name=$(basename "$icon")
  cp "$icon" "public/$name"
  echo "  Copied: $icon -> public/$name"
  ((copied++))
done

# Copy files with BUILD_TIME replacement
for f in "${FILES_WITH_BUILD_TIME[@]}"; do
  sed "s/__BUILD_TIME__/$BUILD_TIME/g" "static/$f" > "public/$f"
  echo "  Copied: static/$f -> public/$f (BUILD_TIME=$BUILD_TIME)"
  ((copied++))
done

# Write build info for debugging
BUILD_SHA="${APP_VERSION:-${COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"
printf 'BUILD_SHA=%s\nBUILD_TIME_UTC=%s\n' "$BUILD_SHA" "$BUILD_TIME" > "public/build.txt"
echo "  Created: public/build.txt (SHA=$BUILD_SHA)"

echo "=========================================="
echo "Sync complete: $copied file(s) copied"
echo "=========================================="
