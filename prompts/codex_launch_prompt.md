# Codex Launch Prompt (Realtime Translator PWA)

目的: 未達項目を最小差分で埋める。今回はドキュメント/スクリプト整備が中心。

## 固定情報
- Front: https://realtime-translator-pwa-483710.web.app/
- API: https://realtime-translator-api-7xgx6ra47q-an.a.run.app/
- Region: asia-northeast1
- API prefix: `/api/v1`

## 実装方針
- 既存のコード/設定（app.py, firebase.json）に一致させる
- 大規模リファクタ禁止。必要なら最小ガードのみ追加
- 秘密情報は追加しない（.env は gitignore）

## 重要エンドポイント
- `/api/v1/jobs/create`, `/api/v1/jobs/complete`, `/api/v1/usage/remaining`
- `/api/v1/admin/cleanup` (本番: OIDC/IAM Bearer)
- `/api/v1/billing/stripe/checkout`, `/portal`, `/webhook`
- `/health`, `/docs`

## 参照 runbooks
- `runbooks/launch_dod.md`
- `runbooks/deploy_runbook.md`
- `runbooks/stripe_e2e_runbook.md`
