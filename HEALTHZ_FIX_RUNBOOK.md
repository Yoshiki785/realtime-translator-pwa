# HEALTHZ 404 問題 調査・修正ランブック

## 問題
Cloud Run 上で `GET /healthz` が Google 標準 404 (robot page) を返す

## 原因特定

### 観測結果
1. `curl $API_BASE/openapi.json` → `/healthz` パスが含まれている
2. `curl -i $API_BASE/healthz` → HTTP/2 404 + Google HTML (robot page)
3. FastAPI アプリ側ではルート登録済み、コード上問題なし

### 結論
**Cloud Run の既知の問題: 末尾が `z` のパスは予約済み**

Cloud Run インフラストラクチャは `/healthz` などの末尾が `z` のパスを内部で予約しており、アプリケーションに到達する前に Google のデフォルト 404 ページを返す。

## 解決策

`/healthz` を廃止し、`/health` に統一。

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `app.py` | `@app.get("/healthz")` → `@app.get("/health")` |
| `scripts/smoke_check.sh` | `/healthz` → `/health` |
| `HEALTHZ_RUNBOOK.md` | `/healthz` → `/health`、既知の問題追記 |
| `SMOKE_RUNBOOK.md` | `/healthz` → `/health`、既知の問題追記 |
| `ops/SMOKE_CHECK.md` | `/healthz` → `/health`、既知の問題追記 |

### launchd plist
変更不要（スクリプトが `/health` を参照するため）

## 検証コマンド

### ローカル検証
```bash
cd "/Users/nakamurayoshiki/Documents/Vibe Coding/realtime-translator-pwa-main"

# routes 確認
python3 -c "
from app import app
routes = [r.path for r in app.routes if hasattr(r, 'path')]
print('/health in routes:', '/health' in routes)
"

# ローカル起動 + curl
PORT=8080 uvicorn app:app --host 0.0.0.0 --port 8080 &
sleep 2
curl -i http://localhost:8080/health
```

### 本番検証（デプロイ後）
```bash
API_BASE="https://realtime-translator-api-853238768850.asia-northeast1.run.app"

# health チェック
curl -i "$API_BASE/health"

# openapi.json に /health が含まれているか
curl -s "$API_BASE/openapi.json" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("/health" in d.get("paths", {}))'

# smoke_check.sh
API_BASE="$API_BASE" ./scripts/smoke_check.sh
```

## デプロイコマンド（手動実行）

```bash
cd "/Users/nakamurayoshiki/Documents/Vibe Coding/realtime-translator-pwa-main"
gcloud run deploy realtime-translator-api --source . --region asia-northeast1 --allow-unauthenticated
```

## 参考
- Cloud Run Known Issues: "Reserved URL paths" (paths ending with `z`)
