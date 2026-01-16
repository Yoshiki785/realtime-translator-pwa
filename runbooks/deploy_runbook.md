# Deploy Runbook (Cloud Run + Firebase Hosting)

## 前提
- Cloud Run region: `asia-northeast1`
- Front は Firebase Hosting の `public/` を配信（firebase.json と一致）
- API prefix は `/api/v1`

## Cloud Run デプロイ
既存の `cloudbuild.yaml` を使う場合は `region` を必ず `asia-northeast1` に上書きする。

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=realtime-translator-api,_ENV=production,_REGION=asia-northeast1,_REPO_NAME=realtime-translator
```

- `ENV=production` を設定することで `DEBUG_AUTH_BYPASS` は強制無効
- 主要 env/secrets: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `GCS_BUCKET`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`

## Firebase Hosting デプロイ
```bash
firebase deploy --only hosting
```

- `firebase.json` の `public` は `public`
- `rewrites` の `serviceId` は `realtime-translator-api`、`region` は `asia-northeast1`
- `headers` (CSP) は未設定

## Post-Deploy チェック
- `GET https://realtime-translator-api-7xgx6ra47q-an.a.run.app/health`
- `GET https://realtime-translator-api-7xgx6ra47q-an.a.run.app/docs`
- `scripts/e2e.sh` で `usage → create → complete → usage`

## Cleanup (Scheduler)
- `/api/v1/admin/cleanup` は本番で OIDC/IAM を前提
- Backlog: Cloud Scheduler の Service Account + invoker 制限、必要なら OIDC トークン検証を追加
