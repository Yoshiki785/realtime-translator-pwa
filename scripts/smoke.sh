#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-https://realtime-translator-pwa-483710.web.app}"
ID_TOKEN="${ID_TOKEN:-$(./scripts/get_firebase_id_token.sh)}"

echo "== health =="
curl -sS "$HOST/health" | jq .

echo "== openapi info =="
curl -sS "$HOST/openapi.json" | jq -r '.info.title, .info.version'

echo "== billing status =="
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "$HOST/api/v1/billing/status" | jq .

echo "== me (quota) =="
curl -sS -H "Authorization: Bearer $ID_TOKEN" \
  "$HOST/api/v1/me" | jq '{uid, plan, ticketSecondsBalance, creditSeconds, totalAvailableThisMonth}'
