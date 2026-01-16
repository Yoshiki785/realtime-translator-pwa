# Launch DoD (Realtime Translator PWA)

## 既知の本番URL（固定）
- Front (Firebase Hosting): https://realtime-translator-pwa-483710.web.app/
- API (Cloud Run): https://realtime-translator-api-7xgx6ra47q-an.a.run.app/
- Region: asia-northeast1
- フロント資産の正: `public/`（Firebase Hosting の `public` に一致）

## Hosting 設定（firebase.json と一致）
- `public`: `public`
- rewrites:
  - `/audio_m4a` → Cloud Run `realtime-translator-api` (asia-northeast1)
  - `/summarize` → Cloud Run `realtime-translator-api` (asia-northeast1)
  - `/translate` → Cloud Run `realtime-translator-api` (asia-northeast1)
  - `/token` → Cloud Run `realtime-translator-api` (asia-northeast1)
  - `/api/**` → Cloud Run `realtime-translator-api` (asia-northeast1)
  - `**` → `/index.html`
- `headers` 設定なし（CSP/追加ヘッダーは未定義）

## API 実エンドポイント（app.py と一致）
- API prefix: `/api/v1`
- Auth: Firebase ID token（`Authorization: Bearer <ID_TOKEN>`）
  - `ENV=production` では `DEBUG_AUTH_BYPASS` 強制無効
- Health: `GET /health`
- Docs: `GET /docs` / `GET /openapi.json`
- Jobs:
  - `POST /api/v1/jobs/create`
  - `POST /api/v1/jobs/complete` (`{"jobId":"...","audioSeconds":<int>}`)
  - `GET /api/v1/usage/remaining`
  - `GET /api/v1/me`
- Admin cleanup:
  - `POST /api/v1/admin/cleanup`
  - 本番: OIDC/IAM の Bearer トークン（Cloud Run invoker 制限前提）
  - 開発: `x-admin-token: $ADMIN_CLEANUP_TOKEN`
- Billing (Stripe):
  - `POST /api/v1/billing/stripe/checkout`
  - `POST /api/v1/billing/stripe/portal`
  - `POST /api/v1/billing/stripe/webhook`
- Front-facing API (auth required):
  - `POST /token` (form: `vad_silence`)
  - `POST /translate` (form: `text`, `input_lang`, `output_lang`)
  - `POST /summarize` (form: `text`, `output_lang`)
  - `POST /audio_m4a` (form: `file`)

## プラン仕様（固定）
- Free: 1800 sec/月, retention 7日
- Pro: 7200 sec/月, retention 30日
- 残量0の受付拒否: `POST /api/v1/jobs/create` → HTTP 402 (`no_remaining_minutes` / `no_reservable_minutes`)
- Free の日次上限到達: HTTP 429 (`daily_limit_reached`)

## Billing / Stripe 同期条件
- Checkout は `metadata.uid` を必ず付与（実装は ID トークンの uid を自動付与）
- Webhook は `metadata.uid` を優先し、無い場合は `stripeCustomerId` で逆引き
- subscription status が `active` のとき `plan=pro`、それ以外は `plan=free`

## CORS/CSP 方針
- API CORS (FastAPI): `allow_origins=["*"]`, `allow_methods=["*"]`, `allow_headers=["*"]`
- Hosting CSP: firebase.json に `headers` 未定義（必要なら追加）

## DoD チェック
- `/health` が `{"ok": true}` を返す
- `/docs` が表示される
- `public/` が Hosting の配信元であることを確認
- `/api/v1/jobs/create` が残量0で HTTP 402 を返すことを確認
- Stripe webhook が `received=true` を返すことを確認（署名検証必須）
- `scripts/e2e.sh` で usage → create → complete → usage が成功
