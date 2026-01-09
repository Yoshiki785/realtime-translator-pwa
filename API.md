# API仕様書

## 認証

### Firebase ID Token

ほとんどのエンドポイントは Firebase Authentication の ID token が必要です。

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**開発環境のみ**: `DEBUG_AUTH_BYPASS=1` を設定すると認証をスキップできます（本番では強制無効化）。

---

## ジョブ管理

### POST /api/v1/jobs/create

ジョブを作成し、月次クォータをチェックします。

**認証**: 必要

**リクエスト**: なし（Bodyなし）

**レスポンス**:
```json
{
  "jobId": "abc123...",
  "yyyymm": "2026-01",
  "remainingSeconds": 1680,
  "plan": "free",
  "retentionDays": 7
}
```

**エラー**:
- `401`: 認証失敗
- `402`: クォータ超過
  ```json
  {
    "detail": {
      "error": "quota_exceeded",
      "plan": "free",
      "usedSeconds": 1800,
      "quotaSeconds": 1800
    }
  }
  ```

---

### POST /api/v1/jobs/complete

ジョブを完了し、使用秒数を月次集計に加算します。

**認証**: 必要

**リクエスト**:
```json
{
  "jobId": "abc123...",
  "audioSeconds": 120
}
```

**レスポンス**:
```json
{
  "status": "succeeded",
  "usedSeconds": 120
}
```

**エラー**:
- `400`: jobId または audioSeconds が不正
- `401`: 認証失敗
- `403`: uidが一致しない
- `404`: ジョブが見つからない

---

### GET /api/v1/usage/remaining

現在の月次使用量と残量を取得します。

**認証**: 必要

**レスポンス**:
```json
{
  "plan": "free",
  "quotaSeconds": 1800,
  "usedSeconds": 120,
  "remainingSeconds": 1680,
  "yyyymm": "2026-01"
}
```

---

## 課金（Stripe）

### POST /api/v1/billing/stripe/checkout

Stripe Checkout Session を作成します（Proプラン登録用）。

**認証**: 必要

**リクエスト**:
```json
{
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "email": "user@example.com"
}
```

**レスポンス**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**エラー**:
- `401`: 認証失敗
- `500`: Stripe設定エラー、またはCheckout作成失敗

**フロー**:
1. フロントでこのAPIを呼び出し
2. 返却された `url` にリダイレクト
3. ユーザーがStripeで支払い完了
4. Stripe Webhookでプラン同期
5. `successUrl` にリダイレクト

---

### POST /api/v1/billing/stripe/portal

Stripe Customer Portal Session を作成します（サブスク管理・解約用）。

**認証**: 必要

**リクエスト**:
```json
{
  "returnUrl": "https://example.com"
}
```

**レスポンス**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**エラー**:
- `400`: Stripe Customer IDが未登録
- `401`: 認証失敗
- `500`: Stripe設定エラー、またはPortal作成失敗

**フロー**:
1. フロントでこのAPIを呼び出し
2. 返却された `url` にリダイレクト
3. ユーザーがStripe Portalでサブスク管理
4. `returnUrl` にリダイレクト

---

### POST /api/v1/billing/stripe/webhook

Stripe Webhook ハンドラー。

**認証**: Stripe署名検証

**対応イベント**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**レスポンス**:
```json
{
  "received": true
}
```

**処理内容**:
- サブスクリプションステータスに応じて `users/{uid}` のプラン更新
- `plan`, `quotaSeconds`, `retentionDays`, `subscriptionStatus`, `currentPeriodEnd`, `stripeCustomerId` を同期
- ログ出力（uid、イベントタイプ、status）

---

## 管理

### POST /api/v1/admin/cleanup

期限切れジョブを削除します。

**認証**:
- **本番**: Cloud Scheduler からOIDC認証で呼び出し
- **開発**: `x-admin-token` ヘッダー

**リクエスト**: なし（Query param: `limit=200` でスキャン上限指定可能）

**レスポンス**:
```json
{
  "deleted": 10,
  "scanned": 12,
  "errors": 2
}
```

**ログ**:
- 削除成功: `{"jobId": "...", "deleteAt": "..."}`
- 削除失敗: `{"error": "..."}`
- 完了サマリ: `{"deleted": 10, "scanned": 12, "errors": 2}`

---

## テスト用（開発環境のみ）

### POST /api/v1/test/create-expired-job

期限切れジョブを作成します（cleanup テスト用）。

**認証**: 必要 + `DEBUG_AUTH_BYPASS=1`

**本番環境**: `404 Not Found`（強制無効化）

**レスポンス**:
```json
{
  "jobId": "abc123...",
  "deleteAt": "2026-01-04T22:37:42.006958+00:00"
}
```

---

## その他

### GET /healthz

ヘルスチェック。

**レスポンス**:
```json
{
  "status": "ok"
}
```

### POST /token

OpenAI Realtime API の client secret を取得します。

**リクエスト** (Form):
- `vad_silence` (optional): VAD silence duration (ms)

**レスポンス**:
```json
{
  "value": "client_secret_..."
}
```

### POST /translate

テキストを日本語に翻訳します。

**リクエスト** (Form):
- `text`: 翻訳したいテキスト

**レスポンス**:
```json
{
  "translation": "翻訳結果..."
}
```

### POST /summarize

テキストを要約します（Markdown形式）。

**リクエスト** (Form):
- `text`: 要約したいテキスト

**レスポンス**:
```json
{
  "summary": "## 要約\n..."
}
```

### POST /audio_m4a

WebM音声をM4Aに変換します。

**リクエスト** (multipart/form-data):
- `file`: 音声ファイル（WebM等）

**レスポンス**:
```json
{
  "url": "/downloads/converted-abc123.m4a"
}
```

---

## エラーレスポンス形式

```json
{
  "detail": "error_message_or_object"
}
```

**HTTPステータスコード**:
- `400`: Bad Request（リクエスト不正）
- `401`: Unauthorized（認証失敗）
- `402`: Payment Required（クォータ超過）
- `403`: Forbidden（権限なし）
- `404`: Not Found（リソース不存在）
- `500`: Internal Server Error（サーバーエラー）

---

## ログ構造

すべてのログは構造化されています（JSON形式）。

**例**:
```json
{
  "timestamp": "2026-01-06T12:34:56.789Z",
  "level": "INFO",
  "message": "Job created",
  "extra": "{\"uid\": \"abc123\", \"jobId\": \"xyz789\", \"plan\": \"free\", \"remainingSeconds\": 1680}"
}
```

**主要ログキー**:
- `uid`: ユーザーID
- `jobId`: ジョブID
- `plan`: プラン（free/pro）
- `usedSeconds`: 使用秒数
- `remainingSeconds`: 残り秒数
- `eventType`: Stripeイベントタイプ
- `error`: エラー詳細
