# Stripe E2E Runbook

## 実エンドポイント
- Checkout: `POST /api/v1/billing/stripe/checkout`
- Portal: `POST /api/v1/billing/stripe/portal`
- Webhook: `POST /api/v1/billing/stripe/webhook`

## 必須 env
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

## Checkout / Portal
- 認証: Firebase ID token (`Authorization: Bearer <ID_TOKEN>`)
- Checkout payload:
  - `successUrl`, `cancelUrl` を指定
  - 実装で `metadata.uid` を自動付与（ID token uid）
- Portal payload:
  - `returnUrl` を指定
  - `users/{uid}.stripeCustomerId` が必要

## Webhook (Stripe CLI 推奨)
```bash
stripe listen --forward-to https://realtime-translator-api-7xgx6ra47q-an.a.run.app/api/v1/billing/stripe/webhook
```

- `Stripe-Signature` が必須
- subscription イベントでは `metadata.uid` を必須扱い
  - 無い場合は `stripeCustomerId` から逆引き
- `status=active` のサブスクは `plan=pro`、それ以外は `plan=free`

## 検証ポイント
- checkout で `sessionId`/`url` が返る
- webhook が `{"received": true}` を返す
- `users/{uid}` が `plan=pro` へ更新される（subscription active）
