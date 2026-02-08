# Launch MVP Runbook

チェックリスト形式の最小手順。詳細は [DEPLOY.md](../DEPLOY.md) を参照。

| Key | Value |
|-----|-------|
| Firebase Project | `realtime-translator-pwa-483710` |
| Cloud Run URL | `https://realtime-translator-api-853238768850.asia-northeast1.run.app` |
| Hosting URL | `https://realtime-translator-pwa-483710.web.app` |

---

## 1. Pre-flight（事前確認）

```bash
# プロジェクト確認
firebase use                        # → realtime-translator-pwa-483710
gcloud config get-value project     # → realtime-translator-pwa-483710

# ワークツリーがクリーンか
git status --short                  # → 空であること

# pricing / sync チェック
node ./scripts/generate_pricing.js --check   # → exit 0
./scripts/check_public_sync.sh               # → exit 0

# Region 統一確認（すべて asia-northeast1 であること）
grep '"region"' firebase.json | sort -u

# pricing drift チェック（差分があれば不一致）
diff <(grep -oP '"t\d+"' app.py | sort -u) \
     <(grep -oP '"packId":\s*"t\d+"' static/config/pricing.json | grep -oP 't\d+' | sort -u)
```

> **STOP 条件**: pricing.json に存在しない packId が app.py にある場合、
> **リリースを停止**して差分を解消してからやり直すこと。

- [ ] Stripe Dashboard の各チケット価格 ↔ `pricing.json` の `priceJpy` が一致（目視）

---

## 2. Deploy（デプロイ実行）

```bash
# ---- Cloud Run（⚠ _REGION=asia-northeast1 必須。cloudbuild.yaml デフォルトは us-central1）----
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=asia-northeast1

# ---- Cloud Run ヘルスチェック ----
curl -fsS https://realtime-translator-api-853238768850.asia-northeast1.run.app/health

# ---- Firestore Rules（変更がある場合のみ）----
firebase deploy --only firestore:rules --project realtime-translator-pwa-483710

# ---- Hosting ----
npm run deploy:hosting
# 出力に realtime-translator-pwa-483710 が表示されることを確認
```

> **注意**: `scripts/deploy_hosting.sh` は使用禁止（`generate_pricing.js` 未実行・`--project` 指定なし）。
> 必ず `npm run deploy:hosting` を使うこと。

---

## 3. Smoke Test

```bash
# /health 疎通
curl -fsS https://realtime-translator-pwa-483710.web.app/health

# build.txt タイムスタンプ（デプロイ直後の時刻であること）
curl -fsS https://realtime-translator-pwa-483710.web.app/build.txt

# Cloud Logging ERROR 確認（空出力が正常）
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity>=ERROR AND resource.labels.service_name="realtime-translator-api"' \
  --limit=10 --freshness=5m --project=realtime-translator-pwa-483710
```

- [ ] ブラウザで `https://realtime-translator-pwa-483710.web.app/?debug=1` を開き UI を目視確認

---

## 4. Evidence（エビデンス記録）

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

```bash
# ---- Hosting ロールバック ----
firebase hosting:rollback --project realtime-translator-pwa-483710

# ---- Cloud Run ロールバック ----
gcloud run revisions list \
  --service=realtime-translator-api \
  --region=asia-northeast1 \
  --project=realtime-translator-pwa-483710

gcloud run services update-traffic realtime-translator-api \
  --to-revisions=<PREVIOUS_REVISION>=100 \
  --region=asia-northeast1 \
  --project=realtime-translator-pwa-483710
```

ロールバック後は **3. Smoke Test** を再実行すること。
詳細なロールバック手順は [DEPLOY.md](../DEPLOY.md) を参照。
