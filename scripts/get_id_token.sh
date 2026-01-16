#!/usr/bin/env bash
set -euo pipefail

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  cat <<'EOF'
This helper must be sourced to avoid printing tokens.
It does not fetch tokens via CLI; paste a token copied from DevTools.

Usage:
  source scripts/get_id_token.sh
EOF
  exit 1
fi

if [[ -n "${ID_TOKEN:-}" ]]; then
  return 0
fi

read -r -s -p "Paste Firebase ID token (input hidden): " ID_TOKEN
echo
if [[ -z "$ID_TOKEN" ]]; then
  echo "ID_TOKEN is empty." >&2
  return 1
fi
export ID_TOKEN
