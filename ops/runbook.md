# 運用Runbook

## ログプレフィックス規約

| プレフィックス | 用途 |
|---------------|------|
| `[rtc]` | RTC接続関連（connectionState, DataChannel） |
| `[net]` | ネットワーク断/復帰 |
| `[auth]` | 認証/トークン（401, ログイン/ログアウト） |
| `[job]` | ジョブ作成/完了（reserveJobSlot, completeJob） |
| `[billing]` | 課金/Stripe関連 |
| `[init]` | 初期化処理 |
| `[error]` | 致命的エラー |

## Cloud Run ログ確認

### 基本ログ取得
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=realtime-translator" \
  --limit=100 \
  --format="table(timestamp,jsonPayload.message)"
```

### エラーログのみ
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=realtime-translator AND severity>=ERROR" \
  --limit=50 \
  --format="table(timestamp,severity,jsonPayload.message)"
```

### 5xx エラー
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=realtime-translator AND httpRequest.status>=500" \
  --limit=20
```

### 特定プレフィックスでフィルタ（例: [auth]）
```bash
gcloud logging read 'resource.type=cloud_run_revision AND textPayload:"[auth]"' \
  --limit=50
```

## Stripe webhook 失敗確認

```bash
gcloud logging read 'resource.type=cloud_run_revision AND textPayload:"webhook" AND severity>=WARNING' \
  --limit=20
```

## Firebase Hosting

### デプロイ履歴
```bash
firebase hosting:channel:list
```

### ロールバック
```bash
firebase hosting:rollback
```

## フロントエンド致命的エラー

ブラウザDevToolsのConsoleで以下をフィルタ:
- `[error]` - 致命的エラー
- `[net]` - ネットワーク断
- `ReferenceError` / `TypeError` - JSランタイムエラー

## 障害対応フロー

1. **ユーザー報告受信**
   - 再現手順/ブラウザ/時刻を確認

2. **ログ確認**
   - Cloud Run: 5xx, webhook失敗
   - フロント: DevTools Console

3. **切り分け**
   - サーバー側: Cloud Run再デプロイ
   - フロント側: Firebase Hosting再デプロイ
   - Stripe: Stripe Dashboard確認

4. **ロールバック**
   ```bash
   # Firebase Hosting
   firebase hosting:rollback

   # Cloud Run
   gcloud run services update-traffic realtime-translator --to-revisions=REVISION_NAME=100
   ```

## 監視ダッシュボード（将来）

- Cloud Monitoring アラート設定（5xx率、レイテンシ）
- Stripe Dashboard webhookログ
- Firebase Crashlytics（PWA対応時）
