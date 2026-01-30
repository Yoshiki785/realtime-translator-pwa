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
FILES=("app.js" "index.html" "styles.css")

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

echo "=========================================="
echo "Sync complete: $copied file(s) copied"
echo "=========================================="
