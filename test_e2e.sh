#!/bin/bash
# E2E テストスクリプト (DEBUG_AUTH_BYPASS=1 環境用)

set -e

BASE_URL="http://localhost:8000"

echo "=== E2E テスト開始 ==="
echo

# 1. サーバーヘルスチェック
echo "[1] サーバーヘルスチェック..."
curl -s "$BASE_URL/healthz" | jq .
echo

# 2. Job 作成
echo "[2] Job 作成..."
JOB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/jobs/create")
echo "$JOB_RESPONSE" | jq .
JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.jobId')
echo "作成された Job ID: $JOB_ID"
echo

# 3. 使用量確認（初回）
echo "[3] 使用量確認（初回）..."
curl -s "$BASE_URL/api/v1/usage/remaining" | jq .
echo

# 4. Job 完了
echo "[4] Job 完了 (120秒)..."
curl -s -X POST "$BASE_URL/api/v1/jobs/complete" \
  -H "Content-Type: application/json" \
  -d "{\"jobId\": \"$JOB_ID\", \"audioSeconds\": 120}" | jq .
echo

# 5. 使用量確認（完了後）
echo "[5] 使用量確認（完了後）..."
curl -s "$BASE_URL/api/v1/usage/remaining" | jq .
echo

# 6. 期限切れ Job 作成（テスト用）
echo "[6] 期限切れ Job 作成（テスト用）..."
EXPIRED_JOB=$(curl -s -X POST "$BASE_URL/api/v1/test/create-expired-job")
echo "$EXPIRED_JOB" | jq .
echo

# 7. Cleanup 実行
echo "[7] Cleanup 実行..."
curl -s -X POST "$BASE_URL/api/v1/admin/cleanup" \
  -H "x-admin-token: local-admin-token-12345" | jq .
echo

# 8. Quota 超過テスト（1800秒完了 → 次の作成で402）
echo "[8] Quota 超過テスト..."
echo "  8-1. 新規 Job 作成..."
JOB2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/jobs/create")
JOB2_ID=$(echo "$JOB2_RESPONSE" | jq -r '.jobId')
echo "  Job ID: $JOB2_ID"

echo "  8-2. 1800秒で完了..."
curl -s -X POST "$BASE_URL/api/v1/jobs/complete" \
  -H "Content-Type: application/json" \
  -d "{\"jobId\": \"$JOB2_ID\", \"audioSeconds\": 1800}" | jq .

echo "  8-3. Quota 超過で Job 作成試行（402 エラー期待）..."
HTTP_CODE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/v1/jobs/create" -o /tmp/quota_test.json)
cat /tmp/quota_test.json | jq .
echo "  HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "402" ]; then
  echo "  ✓ Quota 超過テスト成功"
else
  echo "  ✗ Quota 超過テスト失敗 (期待: 402, 実際: $HTTP_CODE)"
fi
echo

echo "=== E2E テスト完了 ==="
