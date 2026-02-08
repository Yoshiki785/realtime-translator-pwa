# Launch MVP Runbook

最小限のチェックリスト。詳細な運用手順は [DEPLOY.md](../DEPLOY.md) を参照。

**定数**

| Key | Value |
|-----|-------|
| Firebase Project | `realtime-translator-pwa-483710` |
| Cloud Run URL | `https://realtime-translator-api-853238768850.asia-northeast1.run.app` |
| Hosting URL | `https://realtime-translator-pwa-483710.web.app` |

---

## 1. Pre-flight（事前確認）

```bash
# Firebase プロジェクト確認（legacy でないこと）
firebase use
# → realtime-translator-pwa-483710

# gcloud プロジェクト確認
gcloud config get-value project
# → realtime-translator-pwa-483710

# ワークツリーがクリーンか確認
git status --short
# → 空であること（未コミット変更なし）

# pricing.json 生成チェック
node ./scripts/generate_pricing.js --check
# → exit 0

# Region 統一確認（すべて asia-northeast1 であること）
grep '"region"' firebase.json | sort -u
# → "region": "asia-northeast1"

# public/ ↔ static/ 同期チェック
./scripts/check_public_sync.sh
# → exit 0
```

### pricing drift チェック（手動照合）

`app.py` の `TICKET_PACKS` と `static/config/pricing.json` の `ticketPacks` を照合する。

```bash
# app.py 側の packId 一覧
grep -oP '"t\d+"' app.py | sort -u

# pricing.json 側の packId 一覧
grep -oP '"packId":\s*"t\d+"' static/config/pricing.json | grep -oP 't\d+' | sort -u

# 差分を確認（出力があれば不一致）
diff <(grep -oP '"t\d+"' app.py | sort -u) \
     <(grep -oP '"packId":\s*"t\d+"' static/config/pricing.json | grep -oP 't\d+' | sort -u)
```

> **STOP 条件**: pricing.json に存在しない packId が app.py にある場合、
> **リリースを停止**して差分を解消してからやり直すこと。

### Stripe 価格照合（目視）

- [ ] Stripe Dashboard の各チケット価格 ↔ `pricing.json` の `priceJpy` が一致すること

---

## 2. Deploy（デプロイ実行）

Cloud Run → Hosting の順にデプロイする。

### 2a. Cloud Run

```bash
# ⚠ _REGION=asia-northeast1 を必ず指定（cloudbuild.yaml デフォルトは us-central1）
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=asia-northeast1
```

### 2b. Cloud Run ヘルスチェック

```bash
curl -fsS https://realtime-translator-api-853238768850.asia-northeast1.run.app/health
# → {"status":"ok",...}
```

### 2c. Firestore Rules（変更がある場合のみ）

```bash
firebase deploy --only firestore:rules --project realtime-translator-pwa-483710
```

### 2d. Hosting

```bash
# 唯一の正規デプロイコマンド（sync + check + deploy を一括実行）
npm run deploy:hosting
```

> **注意**: `scripts/deploy_hosting.sh` は `generate_pricing.js` 未実行・`--project` 指定なしのため**使用禁止**。
> 必ず `npm run deploy:hosting` を使うこと。

デプロイ出力に `realtime-translator-pwa-483710` が表示されることを確認。

---

## 3. Smoke Test

```bash
# /health 疎通
curl -fsS https://realtime-translator-pwa-483710.web.app/health
# → Cloud Run からのレスポンスが返ること

# build.txt タイムスタンプ（デプロイ直後の時刻であること）
curl -fsS https://realtime-translator-pwa-483710.web.app/build.txt
```

- [ ] ブラウザで `https://realtime-translator-pwa-483710.web.app/?debug=1` を開き UI を目視確認
- [ ] Cloud Logging で直近 5 分の ERROR を確認

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity>=ERROR AND resource.labels.service_name="realtime-translator-api"' \
  --limit=10 --freshness=5m --project=realtime-translator-pwa-483710
# → エラーがないこと（空出力が正常）
```

---

## 4. Evidence（エビデンス記録）

デプロイごとに以下を記録する。

| Item | Value |
|------|-------|
| Date | YYYY-MM-DD HH:MM JST |
| Deployer | |
| Git SHA | `git rev-parse --short HEAD` |
| Branch | |
| Cloud Run revision | |
| Hosting version | |
| /health response | |
| build.txt | |
| Smoke test result | PASS / FAIL |
| Notes | |

---

## 5. Rollback

### Hosting ロールバック

```bash
# 直近のリリース一覧を確認
firebase hosting:channel:list --project realtime-translator-pwa-483710

# 前バージョンへロールバック
firebase hosting:rollback --project realtime-translator-pwa-483710
```

### Cloud Run ロールバック

```bash
# リビジョン一覧
gcloud run revisions list \
  --service=realtime-translator-api \
  --region=asia-northeast1 \
  --project=realtime-translator-pwa-483710

# 前リビジョンへトラフィック切替
gcloud run services update-traffic realtime-translator-api \
  --to-revisions=<PREVIOUS_REVISION>=100 \
  --region=asia-northeast1 \
  --project=realtime-translator-pwa-483710
```

ロールバック後は **3. Smoke Test** を再実行すること。

詳細なロールバック手順・トラブルシューティングは [DEPLOY.md](../DEPLOY.md) を参照。
