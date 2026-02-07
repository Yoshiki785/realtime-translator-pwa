# デプロイ・運用ガイド

## アーキテクチャ

- **バックエンド**: Cloud Run（FastAPI + uvicorn）
- **フロントエンド**: Firebase Hosting（静的ファイル）
- **データベース**: Firestore
- **ストレージ**: Cloud Storage
- **課金**: Stripe（Checkout + Customer Portal + Webhook）
- **定期ジョブ**: Cloud Scheduler（cleanup実行）

## 環境変数一覧

### Staging / Production 共通

| 変数名 | 説明 | 設定先 |
|--------|------|--------|
| `ENV` | `production` または `staging` | Cloud Run環境変数 |
| `OPENAI_API_KEY` | OpenAI API キー | Secret Manager |
| `STRIPE_SECRET_KEY` | Stripe秘密鍵 | Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook署名検証シークレット | Secret Manager |
| `STRIPE_PRO_PRICE_ID` | Stripe ProプランのPrice ID | Cloud Run環境変数 |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Firebase Admin SDKサービスアカウントJSON（文字列全体） | Secret Manager |
| `GCS_BUCKET` | Cloud Storageバケット名 | Cloud Run環境変数 |

### Development のみ

| 変数名 | 説明 | 設定先 |
|--------|------|--------|
| `DEBUG_AUTH_BYPASS` | 認証バイパス（`1`で有効、本番では強制無効化） | .env（ローカル） |
| `ADMIN_CLEANUP_TOKEN` | cleanup簡易認証トークン | .env（ローカル） |

**重要**: 本番環境では `ENV=production` を設定すると、`DEBUG_AUTH_BYPASS` と Mock Firestore が強制的に無効化されます。

---

## 初回セットアップ

### 1. GCPプロジェクト準備

```bash
# プロジェクトID設定
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1

# GCP認証
gcloud auth login
gcloud config set project $PROJECT_ID

# 必要なAPIを有効化
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Firestore / Cloud Storage 初期化

```bash
# Firestoreデータベース作成（初回のみ）
gcloud firestore databases create --location=$REGION

# Cloud Storageバケット作成
gsutil mb -l $REGION gs://${PROJECT_ID}-realtime-translator
export GCS_BUCKET=${PROJECT_ID}-realtime-translator
```

### 3. Firebase プロジェクト設定

```bash
# Firebase CLI インストール
npm install -g firebase-tools

# Firebase ログイン
firebase login

# Firebase プロジェクト初期化
firebase init hosting
# 既存のGCPプロジェクトを選択
# public ディレクトリ: static
# SPA: No

# Firebaseプロジェクトと紐付け
firebase use $PROJECT_ID
```

### 4. Secret Manager にシークレット登録

```bash
# OpenAI API Key
echo -n "sk-YOUR_OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=-

# Stripe秘密鍵
echo -n "sk_live_YOUR_STRIPE_SECRET_KEY" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-

# Stripe Webhook Secret
echo -n "whsec_YOUR_STRIPE_WEBHOOK_SECRET" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-

# Firebase Admin SDK サービスアカウントJSON（全体を1行に）
cat service-account-key.json | jq -c . | gcloud secrets create GOOGLE_APPLICATION_CREDENTIALS_JSON --data-file=-
```

### 5. Artifact Registry リポジトリ作成

```bash
gcloud artifacts repositories create realtime-translator \
  --repository-format=docker \
  --location=$REGION \
  --description="Realtime Translator API Docker images"
```

---

## Staging デプロイ

### 1. Cloud Run デプロイ（staging）

```bash
# cloudbuild.yaml の substitutions を staging 用に変更
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=realtime-translator-api-staging,_ENV=staging,_REGION=$REGION,_REPO_NAME=realtime-translator

# または docker build + deploy の手動実行
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/realtime-translator/realtime-translator-api-staging:latest .

docker push $REGION-docker.pkg.dev/$PROJECT_ID/realtime-translator/realtime-translator-api-staging:latest

gcloud run deploy realtime-translator-api-staging \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/realtime-translator/realtime-translator-api-staging:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars ENV=staging,GCS_BUCKET=$GCS_BUCKET,STRIPE_PRO_PRICE_ID=price_STAGING_PRO_PRICE_ID \
  --set-secrets OPENAI_API_KEY=OPENAI_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

### 2. Firebase Hosting デプロイ（staging）

```bash
# firebase.json の rewrites で serviceId を staging に変更
# "serviceId": "realtime-translator-api-staging"

# staging環境にデプロイ
firebase hosting:channel:deploy staging --expires 30d
# または本番デプロイ
firebase deploy --only hosting
```

### 3. Staging 動作確認

```bash
# Cloud Run URL取得
STAGING_API_URL=$(gcloud run services describe realtime-translator-api-staging --region=$REGION --format='value(status.url)')

# ヘルスチェック
curl $STAGING_API_URL/health

# Firebase Hosting URL取得
STAGING_URL=$(firebase hosting:channel:list | grep staging | awk '{print $2}')

# ブラウザで確認
open $STAGING_URL
```

#### E2E テスト

```bash
# Firebase Auth で ID token 取得（Firebase Console または firebase emulators:exec で）
export TEST_TOKEN=YOUR_FIREBASE_ID_TOKEN

# Job作成
curl -X POST $STAGING_API_URL/api/v1/jobs/create \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json"

# Usage確認
curl -X GET $STAGING_API_URL/api/v1/usage/remaining \
  -H "Authorization: Bearer $TEST_TOKEN"
```

---

## Production デプロイ

### 1. Cloud Run デプロイ（production）

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=realtime-translator-api,_ENV=production,_REGION=$REGION,_REPO_NAME=realtime-translator

# または手動デプロイ
gcloud run deploy realtime-translator-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/realtime-translator/realtime-translator-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars ENV=production,GCS_BUCKET=$GCS_BUCKET,STRIPE_PRO_PRICE_ID=price_LIVE_PRO_PRICE_ID \
  --set-secrets OPENAI_API_KEY=OPENAI_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

### 2. Firebase Hosting デプロイ（production）

#### ⚠️ 重要: static/ → public/ フロー

**ルール: `public/` は手編集禁止。必ず `static/` を編集し、デプロイスクリプトで同期する。**

```bash
# 推奨: デプロイスクリプトを使用（static/ → public/ 同期 + デプロイ）
./scripts/deploy_hosting.sh

# または手動で実行
rm -rf public/* && cp -R static/* public/
firebase deploy --only hosting
```

#### Service Worker とキャッシュ

- **通常モード**: SW が network-first で `app.js`, `index.html` を取得（常に最新版）
- **デバッグモード** (`?debug=1`): SW を無効化し、キャッシュをクリア

```bash
# デバッグモードでアクセス（SW無効、常に最新版）
open "https://realtime-translator-pwa-483710.web.app/?debug=1"

# DevTools で確認:
# Application → Service Workers → 「Unregistered」と表示されること
# Console → [SW] Debug mode: SW disabled, caches cleared
```

#### Cache-Control ヘッダ

| ファイル | Cache-Control |
|----------|---------------|
| `index.html`, `app.js`, `sw.js` | `no-cache, no-store, must-revalidate` |
| 画像、フォント | `public, max-age=31536000, immutable` |

### 3. Cloud Scheduler 設定（cleanup 定期実行）

```bash
# Service Account 作成
gcloud iam service-accounts create cleanup-scheduler \
  --display-name="Cleanup Scheduler"

# Cloud Run Invoker ロール付与
gcloud run services add-iam-policy-binding realtime-translator-api \
  --region=$REGION \
  --member="serviceAccount:cleanup-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Cloud Scheduler ジョブ作成（毎日午前2時実行）
PROD_API_URL=$(gcloud run services describe realtime-translator-api --region=$REGION --format='value(status.url)')

gcloud scheduler jobs create http cleanup-expired-jobs \
  --location=$REGION \
  --schedule="0 2 * * *" \
  --uri="$PROD_API_URL/api/v1/admin/cleanup" \
  --http-method=POST \
  --oidc-service-account-email="cleanup-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$PROD_API_URL"
```

### 4. Stripe Webhook 設定

```bash
# Stripe Dashboard (https://dashboard.stripe.com/webhooks) で設定
# Endpoint URL: https://your-cloud-run-url.run.app/api/v1/billing/stripe/webhook
# Events to send:
#   - customer.subscription.created
#   - customer.subscription.updated
#   - customer.subscription.deleted
#   - invoice.paid
#   - invoice.payment_failed

# Webhook署名シークレットを取得してSecret Managerに登録
echo -n "whsec_LIVE_WEBHOOK_SECRET" | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-
```

---

## ロールバック手順

### Cloud Run ロールバック

```bash
# 直前のリビジョンに戻す
gcloud run services update-traffic realtime-translator-api \
  --region=$REGION \
  --to-revisions=PREVIOUS_REVISION=100

# 特定のリビジョンに戻す
gcloud run revisions list --service=realtime-translator-api --region=$REGION

gcloud run services update-traffic realtime-translator-api \
  --region=$REGION \
  --to-revisions=realtime-translator-api-00042-abc=100
```

### Firebase Hosting ロールバック

```bash
# デプロイ履歴確認
firebase hosting:channel:list

# 以前のリリースにロールバック
firebase hosting:rollback

# または特定のバージョンにロールバック
firebase hosting:rollback --version=VERSION_ID
```

---

## 監視・ログ確認

### Cloud Logging でログ確認

```bash
# 最近のエラーログ
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50 \
  --format=json

# 特定のuidのログ
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.uid=\"USER_UID\"" \
  --limit=50

# cleanupジョブのログ
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.message:\"Cleanup completed\"" \
  --limit=10
```

### Cloud Monitoring

```bash
# Cloud Console > Monitoring > Dashboards
# 以下をウォッチ:
# - Cloud Run インスタンス数
# - レイテンシ（P50, P95, P99）
# - エラー率（4xx, 5xx）
# - Firestore 読み取り/書き込み
# - Cloud Run メモリ使用率
```

---

## ローカルでのStripeテスト

### Stripe CLI セットアップ

```bash
# Stripe CLI インストール
brew install stripe/stripe-cli/stripe

# Stripe ログイン
stripe login

# Webhook をローカルに転送
stripe listen --forward-to http://localhost:8000/api/v1/billing/stripe/webhook

# テストイベント送信
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

---

## トラブルシューティング

### 1. Cloud Run デプロイが失敗する

- Secret Managerへのアクセス権限を確認
  ```bash
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```

### 2. Firebase Hosting から Cloud Run にリクエストが届かない

- `firebase.json` の `rewrites` 設定を確認
- Cloud Run の `--allow-unauthenticated` を確認

### 3. Cleanup が実行されない

- Cloud Scheduler のステータス確認
  ```bash
  gcloud scheduler jobs describe cleanup-expired-jobs --location=$REGION
  ```
- Service Account の invoker ロールを確認

### 4. DEBUG_AUTH_BYPASS が本番で有効になっている

- Cloud Run の環境変数 `ENV=production` を確認
- コード内で `IS_PRODUCTION` が正しく判定されているか確認
- ログに `"DEBUG_AUTH_BYPASS is enabled"` が出ていないか確認

---

## セキュリティチェックリスト

- [ ] `ENV=production` が設定されている
- [ ] Secret Manager にすべてのシークレットが登録されている
- [ ] Cloud Run のサービスアカウントに最小権限のみ付与
- [x] Firestore Security Rules が設定されている（firestore.rules: deny-all）
- [ ] Cloud Storage bucket に適切なIAM設定
- [ ] Stripe Webhook 署名検証が有効
- [ ] Cloud Scheduler は専用Service Accountで実行
- [ ] `/api/v1/test/*` エンドポイントが本番で無効化されている
- [ ] ログに機密情報（トークン、APIキー等）が含まれていない

---

## Firestore運用方針（本番）

- 現行構成では、Firestoreは **Cloud Run (Python / Admin SDK)** からのみアクセスする。
- クライアント（`static/app.js`）は Firestore SDK を使わず、`/api/v1/*` 経由でのみデータ取得/更新する。
- そのため `firestore.rules` は `deny-all` を維持する（最小権限）。

### 事前検証（デプロイ前）

```bash
# 1) クライアントがFirestore SDKを直接使っていないことを確認
rg -n "firebase-firestore|getFirestore|firebase\\.firestore|from 'firebase/firestore'" static public

# 2) クライアントがAPI経由で動作していることを確認
rg -n "/api/v1/" static/app.js
```

### Firestore Rules デプロイ

```bash
# ルールのみデプロイ
firebase deploy --only firestore:rules --project realtime-translator-pwa-483710

# （必要時のみ）indexesも反映
firebase deploy --only firestore:indexes --project realtime-translator-pwa-483710
```

### デプロイ後スモーク

- ログイン後に利用枠表示が更新される（`/api/v1/me` 経由）
- 辞書の一覧/追加/更新/削除が動作する（`/api/v1/dictionary*` 経由）
- 課金系導線が動作する（`/api/v1/billing/*` 経由）

---

## バックログ（未実装）

- [ ] App Check 導入（Firebase App Check でクライアント検証）
- [ ] Rate Limit 強化（Cloud Armor、Firestore quota チェック）
- [ ] メトリクス強化（Prometheus、OpenTelemetry）
- [ ] アラート設定（Cloud Monitoring Alerts）
- [ ] DB バックアップ自動化（Firestore export to GCS）
- [ ] カスタムドメイン設定
- [ ] CDN 最適化（Cloud CDN、Firebase Hosting CDN）
- [ ] ユーザー通知（メール、Push通知）
- [ ] 管理画面（Admin Dashboard）
- [ ] A/Bテスト（Firebase Remote Config）
