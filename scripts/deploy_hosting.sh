#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "This will sync static/ -> public/ and deploy hosting."
read -r -p "Proceed with destructive sync? [y/N] " confirm_sync
case "$confirm_sync" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "Aborted."
    exit 1
    ;;
esac

rm -rf public/*
cp -R static/* public/

required_files=(index.html app.js styles.css manifest.json sw.js)
missing=0
for file in "${required_files[@]}"; do
  if [[ ! -f "public/$file" ]]; then
    echo "Missing required file: public/$file"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "Required files missing. Aborting deploy."
  exit 1
fi

echo "Optional local check:"
echo "  cd public && python3 -m http.server 8080"
echo "  Open http://localhost:8080 to verify UI."

read -r -p "Continue to firebase deploy --only hosting? [y/N] " confirm_deploy
case "$confirm_deploy" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "Deploy skipped."
    exit 0
    ;;
esac

firebase deploy --only hosting
