# Stripe Billing E2E Runbook

## TL;DR
- Test modeで Checkout → Webhook → Portal → 解約 → Free復帰 を一連で確認。
- Webhookは raw body で署名検証する。
- 冪等性（event id）と再送を前提にする。

## 症状
- 課金反映が遅い/反映されない。
- Webhook署名検証が失敗する。

## 原因
- Webhookで raw body を使用していない。
- 同一イベントの重複処理/順序入れ替え。
- Test/Liveモード混同。

## 切り分け
- Webhookログに `stripe_event_id` を出して重複を確認。
- Checkout完了イベントから反映までの遅延時間を測定。
- Test modeのAPIキー/endpointで実行しているか確認。

## 対策（実装/設定/コマンド）
- Checkout → Webhook → Portal → 解約 → Free復帰の順で検証。
- Webhook署名検証は raw body で行う（FastAPIでは `Request.body()` を先に読む）。
- 冪等性: `stripe_event_id` をDBに保存して重複はスキップ。
- 順序ズレ: `event.created` で時系列チェックし、最新状態のみ適用。
- TODO: `stripe-cli` のローカル転送手順を追記。

## E2E反映
- 例: Checkout起動 → Webhook受信 → Portal遷移 → 解約 → Free復帰を確認。
- `runbooks/logs/stripe-test-e2e-template.md` に結果を記録。

## 監視/アラート
- Webhook失敗率（5xx/署名失敗）
- Webhook処理遅延（p95）
- 課金反映遅延（Checkout完了から反映まで）

## Cloud Logging でのログ確認

### stdout（アプリの print 出力）
```
resource.type="cloud_run_revision"
resource.labels.service_name="realtime-translator-api"
resource.labels.location="asia-northeast1"
log_id("run.googleapis.com/stdout")
```

### stderr（エラーログ）
```
resource.type="cloud_run_revision"
resource.labels.service_name="realtime-translator-api"
resource.labels.location="asia-northeast1"
log_id("run.googleapis.com/stderr")
```

### Stripe webhook イベントのみ抽出
```
resource.type="cloud_run_revision"
resource.labels.service_name="realtime-translator-api"
resource.labels.location="asia-northeast1"
log_id("run.googleapis.com/stdout")
textPayload=~"stripe_webhook"
```

### 注意点
- Cloud Run の「リクエストログ」にはアプリ内の `print()` や `logger.info()` は表示されない
- アプリログを見るには上記 LQL で stdout/stderr を確認する
- Stripe テストイベント送信後、`[stripe_webhook] received event type=...` がstdoutに出力される

## 記録テンプレ
- `runbooks/logs/stripe-test-e2e-template.md`

## Stripe Webhook 推奨イベント（最小セット）

Stripe Dashboard → Developers → Webhooks で以下を購読する：

| イベント | 用途 |
|----------|------|
| `checkout.session.completed` | Checkout完了時に uid ↔ stripeCustomerId/subscriptionId を紐付け |
| `customer.subscription.created` | サブスク作成時のプラン反映 |
| `customer.subscription.updated` | サブスク更新（プラン変更等） |
| `customer.subscription.deleted` | 解約時のFree復帰 |
| `invoice.payment_failed` | 支払い失敗時の通知/フラグ |
| `invoice.paid` | （任意）支払い成功ログ |

## Cloud Logging LQL（stripe_webhook 専用）

### [stripe_webhook] を含むログのみ抽出
```
resource.type="cloud_run_revision"
resource.labels.service_name="realtime-translator-api"
resource.labels.location="asia-northeast1"
log_id("run.googleapis.com/stdout")
textPayload=~"\\[stripe_webhook\\]"
```

### checkout.session.completed のみ抽出
```
resource.type="cloud_run_revision"
resource.labels.service_name="realtime-translator-api"
resource.labels.location="asia-northeast1"
log_id("run.googleapis.com/stdout")
textPayload=~"checkout.session.completed"
```

## 参考（URL欄）
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/billing/subscriptions/webhooks
