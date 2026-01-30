# Launch-MVP 合格条件チェックリスト

**作成日**: 2026-01-30
**対象リリース**: β版（課金機能はテスト環境のみ）
**ブランチ**: feat/launch-mvp-gate

---

## 対象環境

| 項目 | 状態 |
|------|------|
| Firebase Hosting | Production |
| Cloud Run | Production (asia-northeast1) |
| Stripe | **Test Mode のみ** (Live未有効) |
| Firestore | Production |

---

## MVP合格基準

### 1. ユーザー導線（基本機能）

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 1-1 | ユーザー登録/ログインが完了する | Firebase Auth でメール認証またはGoogle認証 | [ ] |
| 1-2 | Start→録音→文字起こし→翻訳が動作する | 実機テスト（Chrome + マイク許可） | [ ] |
| 1-3 | Stop で正常終了し、ログが残る | UI上でログ確認 | [ ] |
| 1-4 | 履歴（過去のセッション）が確認できる | 設定画面の利用状況で確認 | [ ] |
| 1-5 | エラー時に復帰可能なメッセージが出る | 再試行/再接続ボタンまたは案内 | [ ] |

### 2. 課金表示（テストモード前提）

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 2-1 | Free/Pro プランの表示が正しい | 設定画面の利用状況セクション | [ ] |
| 2-2 | Proアップグレードボタンに「β: テスト環境」表示 | UI確認（誤解防止の明示） | [ ] |
| 2-3 | テスト購入フローが動作する（Stripe Test） | テストカード 4242... で購入完了 | [ ] |
| 2-4 | サブスク管理（解約）導線がある | Stripe Customer Portal へのリンク | [ ] |

**注意**: Stripe Live モードは未有効のため、本番課金は不可。β版として「課金機能は準備中」を明示する。

### 3. 保存期間（表示と実態の一致）

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 3-1 | Free: 7日保持の表示 | UI/FAQ に明記 | [ ] |
| 3-2 | Pro: 30日保持の表示 | UI/FAQ に明記 | [ ] |
| 3-3 | 実際の削除処理が動作する | `/api/v1/admin/cleanup` が期限切れジョブを削除 | [ ] |
| 3-4 | Cloud Scheduler で定期実行される | GCP Console で確認 | [ ] |

**削除タイミング**: `deleteAt` = ジョブ作成日時 + retentionDays (Free=7, Pro=30)

### 4. 問い合わせ導線

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 4-1 | フッターに Contact リンクがある | UI確認 | [ ] |
| 4-2 | mailto: または問い合わせフォームに遷移する | クリックして確認 | [ ] |

### 5. 法務ページ

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 5-1 | Privacy Policy ページが存在する | /privacy.html にアクセス | [ ] |
| 5-2 | Terms of Service ページが存在する | /terms.html にアクセス | [ ] |
| 5-3 | フッターからリンクされている | UI確認 | [ ] |
| 5-4 | 特商法ページ（課金 Live 化時に必須） | **現状は β のため任意**、Live化前に要対応 | [ ] |

### 6. 障害対応（ステータス確認）

| 項目 | 合格条件 | 確認方法 | 状態 |
|------|----------|----------|------|
| 6-1 | /health エンドポイントが 200 を返す | `curl` で確認 | [ ] |
| 6-2 | レスポンスに service, version, time が含まれる | JSON レスポンス確認 | [ ] |
| 6-3 | ログの確認方法が文書化されている | 本ドキュメントに記載 | [ ] |

---

## 手動確認手順

### A. 基本フロー確認

```bash
# 1. トップページにアクセス
open https://realtime-translator-pwa-483710.web.app/

# 2. ログイン（Google認証 or メール）
# 3. 設定ボタン（⚙︎）→ 利用状況を確認
# 4. Start ボタン → マイク許可 → 発話
# 5. 文字起こしと翻訳がリアルタイム表示されることを確認
# 6. Stop ボタン → ログが保存されることを確認
```

### B. 課金フロー確認（テスト環境）

```bash
# 1. 設定画面 → 「Proにアップグレード」ボタン（β表示あり）
# 2. Stripe Checkout に遷移
# 3. テストカード: 4242 4242 4242 4242, 有効期限: 任意の未来, CVC: 任意3桁
# 4. 購入完了 → Free→Pro に変わることを確認
# 5. 「サブスク管理」ボタン → Stripe Customer Portal で解約可能なことを確認
```

### C. 健全性チェック

```bash
# Health check
curl -s https://realtime-translator-api-XXXXX.asia-northeast1.run.app/health | jq

# 期待レスポンス:
# {"ok": true, "service": "realtime-translator-api", "version": "...", "time": "..."}
```

---

## 既知の制約

| 制約 | 影響 | 対応方針 |
|------|------|----------|
| Stripe Live 未有効 | 本番課金不可 | β版として明示、テスト購入のみ許可 |
| 特商法ページ未作成 | 有料サービス提供時に法的要件 | Live化前に要対応 |
| E2E自動テストなし | 手動確認のみ | smoke_check.sh + 手動手順で代替 |
| 問い合わせメール | プレースホルダー（support@example.com） | **ローンチ前に実アドレスに変更必須** |

---

## ロールバック手順

### Firebase Hosting

```bash
# 前バージョンの一覧
firebase hosting:channel:list

# 特定バージョンにロールバック
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL TARGET_SITE_ID:live

# または、リリース一覧から選択
firebase hosting:releases:list --limit 10
```

### Cloud Run

```bash
# リビジョン一覧
gcloud run revisions list --service=realtime-translator-api --region=asia-northeast1

# 特定リビジョンにトラフィック移行
gcloud run services update-traffic realtime-translator-api \
  --region=asia-northeast1 \
  --to-revisions=REVISION_NAME=100
```

---

## ログ確認方法

### Cloud Run ログ

```bash
# 最新ログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=realtime-translator-api" \
  --limit=50 --format="table(timestamp,textPayload)"

# GCP Console
open https://console.cloud.google.com/run/detail/asia-northeast1/realtime-translator-api/logs
```

### Firebase Hosting

```bash
# Firebase Console
open https://console.firebase.google.com/project/realtime-translator-pwa-483710/hosting
```

---

## 環境変数一覧（Stripe関連）

| 変数名 | 用途 | 設定場所 |
|--------|------|----------|
| `STRIPE_SECRET_KEY` | Stripe API シークレット | Cloud Run Secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名検証 | Cloud Run Secret |
| `STRIPE_PRO_PRICE_ID` | Pro プランの Price ID | Cloud Run 環境変数 |

---

## 最終判定

| 判定項目 | 結果 | 備考 |
|----------|------|------|
| P0（ブロッカー）残存 | [ ] なし / [ ] あり | あれば詳細記載 |
| P1（重要）残存 | [ ] なし / [ ] あり | |
| P2（軽微）残存 | [ ] なし / [ ] あり | |
| **ローンチ可否** | [ ] GO / [ ] NO-GO | |

---

## 更新履歴

- 2026-01-30: 初版作成（feat/launch-mvp-gate）
