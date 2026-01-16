# Env Diff Checklist (Staging vs Production)

## Origin / CORS
- 必須 Origin (Production): `https://realtime-translator-pwa-483710.web.app`
- Staging Origin (存在する場合): `https://<staging-project>.web.app` / `https://<channel>--<project>.web.app`
- 実装上の CORS 設定: FastAPI `allow_origins=["*"]`（将来制限するなら上記 Origin を必ず含める）

## CSP / Headers
- firebase.json に `headers` が未定義（CSP なし）
- CSP を導入する場合は `firebase.json` に追加し、`runbooks/launch_dod.md` も更新

## HTTPS / URL
- Production は HTTPS 固定（Cloud Run / Firebase Hosting）
- `http://localhost` 例外に依存した設定は持ち込まない

## API / Auth
- API prefix は固定で `/api/v1`
- 認証は Firebase ID token（`Authorization: Bearer <ID_TOKEN>`）
- `ENV=production` で `DEBUG_AUTH_BYPASS` は強制無効

## Billing / Plan
- Free: 1800 sec/月, retention 7日
- Pro: 7200 sec/月, retention 30日
- `STRIPE_PRO_PRICE_ID` は環境ごとに設定（staging は placeholder 可）

## Cleanup / Scheduler
- 本番は OIDC/IAM (Cloud Run invoker) で `/api/v1/admin/cleanup` を叩く
- 開発のみ `x-admin-token` で実行
