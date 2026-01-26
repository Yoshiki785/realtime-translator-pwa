# SECURITY_RUNBOOK.md

## Objective
Firebase Auth IDトークン検証を必須化し、APIを保護する（「動くPoC」→「公開できる最小安全ライン」）

## Environment
- Cloud Run: realtime-translator-api (asia-northeast1)
- Project: realtime-translator-pwa-483710
- Firebase Auth: フロントで動作済み

---

## S0: Initialize security state/runbook
**Status: DONE**

- SECURITY_STATE.json created
- SECURITY_RUNBOOK.md created

---

## S1: List APIs that need protection
**Status: DONE**

### 現状分析

#### ✅ 既に認証済み（get_uid_from_request使用）
| エンドポイント | 行 | 説明 |
|---------------|-----|------|
| `/api/v1/jobs/create` | 674 | ジョブ作成 |
| `/api/v1/jobs/complete` | 727 | ジョブ完了 |
| `/api/v1/usage/remaining` | 760 | 使用量確認 |
| `/api/v1/test/create-expired-job` | 791 | テスト用 |
| `/api/v1/billing/stripe/checkout` | 852 | Stripe決済 |
| `/api/v1/billing/stripe/portal` | 890 | Stripe管理 |

#### ❌ 認証が必要だが未実装
| エンドポイント | 行 | 説明 | リスク |
|---------------|-----|------|--------|
| `/token` | 615 | OpenAIトークン取得 | **高** - 無制限呼び出しでOpenAI課金発生 |
| `/translate` | 1035 | 翻訳API | **高** - OpenAI API呼び出し |
| `/summarize` | 1058 | 要約API | **高** - OpenAI API呼び出し |
| `/audio_m4a` | 1093 | 音声変換 | 中 - サーバーリソース消費 |

#### ✅ 認証不要（公開OK）
| エンドポイント | 説明 |
|---------------|------|
| `/` | HTMLページ |
| `/sw.js` | Service Worker |
| `/favicon.ico` | アイコン |
| `/healthz` | ヘルスチェック |
| `/downloads/{filename}` | ダウンロード |

#### ✅ 別の認証方式で保護済み
| エンドポイント | 認証方式 |
|---------------|----------|
| `/api/v1/admin/cleanup` | verify_admin_access（IAM/トークン） |
| `/api/v1/billing/stripe/webhook` | Stripe署名検証 |

### 結論
**4つのエンドポイント**（/token, /translate, /summarize, /audio_m4a）に認証を追加する必要がある

---

## S2: Firebase Admin SDK setup
**Status: DONE (既に実装済み)**

### 確認結果
- `firebase-admin==6.5.0` が requirements.txt に存在
- `ensure_firebase_app()` 関数が app.py:114 に実装済み
- ADC (Application Default Credentials) を使用 → Cloud Runのサービスアカウントで動作
- サービスアカウントキーの埋め込みなし ✅

---

## S3: Add auth dependency to FastAPI
**Status: DONE (既に実装済み)**

### 確認結果
`get_uid_from_request()` 関数が app.py:385 に実装済み:
- Authorizationヘッダーチェック
- Bearer トークン抽出
- `firebase_auth.verify_id_token()` でトークン検証
- 失敗時は 401 を返す
- 本番環境では DEBUG_AUTH_BYPASS を強制無効化

---

## S4: Protect /api/v1/jobs/* endpoints
**Status: DONE (既に実装済み)**

### 確認結果
以下のエンドポイントは既に `get_uid_from_request()` で保護済み:
- `/api/v1/jobs/create` (674行)
- `/api/v1/jobs/complete` (727行)
- `/api/v1/usage/remaining` (760行)

---

## S5: Protect /token, /translate, /summarize, /audio_m4a
**Status: DONE**

### 修正内容
4つのエンドポイントに `get_uid_from_request(request)` を追加:

```python
# /token (615行)
async def create_token(request: Request, vad_silence: int | None = Form(None)):
    uid = get_uid_from_request(request)  # 追加
    logger.info(f"Token requested by uid: {uid}")

# /translate (1040行)
async def translate_text(request: Request, text: str = Form(...)):
    get_uid_from_request(request)  # 追加

# /summarize (1066行)
async def summarize(request: Request, text: str = Form(...)):
    get_uid_from_request(request)  # 追加

# /audio_m4a (1104行)
async def convert_audio(request: Request, file: UploadFile = File(...)):
    get_uid_from_request(request)  # 追加
```

### 認証なしでアクセスした場合
- HTTP 401 `{"detail": "auth_required"}` を返す

### /tokenを認証必須にする理由
- /token は OpenAI Realtime API のエフェメラルトークンを発行する
- 認証なしで呼ばれると、無制限にOpenAI APIを消費される可能性がある
- ユーザーの課金管理（ジョブ作成と連携）のためにも uid が必要

---

## S6: Local test
**Status: DONE (テスト方法記載、再デプロイ後に実行)**

### テスト方法
```bash
# 認証なし → 401期待
curl -s -X POST https://realtime-translator-api-853238768850.asia-northeast1.run.app/token
# 期待: {"detail":"auth_required"}

# 認証あり → 200系期待（有効なFirebase IDトークンが必要）
curl -s -X POST https://realtime-translator-api-853238768850.asia-northeast1.run.app/token \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
# 期待: {"value":"ek_..."}
```

### 現状
旧バージョンがデプロイ済みのため、認証なしでもアクセス可能。S7で再デプロイ後に確認

---

## S7: Redeploy Cloud Run
**Status: DONE**

### デプロイ実行
```bash
gcloud run deploy realtime-translator-api \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300
```

### 結果
- Revision: `realtime-translator-api-00005-r2k`
- 100% トラフィック切り替え完了

### 認証テスト結果
```bash
$ curl -s -X POST .../token
{"detail":"auth_required"}  # ✅ 401

$ curl -s -X POST .../translate -F "text=hello"
{"detail":"auth_required"}  # ✅ 401
```

---

## S8: Verification checklist
**Status: DONE**

### 検証チェックリスト

#### バックエンド（Cloud Run）
- [x] `/token` - 認証なし → 401
- [x] `/translate` - 認証なし → 401
- [x] `/summarize` - 認証なし → 401
- [x] `/audio_m4a` - 認証なし → 401
- [x] `/api/v1/jobs/create` - 認証なし → 401
- [x] `/api/v1/jobs/complete` - 認証なし → 401
- [x] `/healthz` - 認証なし → 200 (ヘルスチェックは公開)
- [x] `/` - 認証なし → 200 (HTMLページは公開)

#### フロントエンド（Firebase Hosting）
- [ ] ログイン後、Startボタン押下で翻訳開始できることを確認
- [ ] ログアウト状態でStartボタン押下 → エラー表示（ログイン必要）

---

## S9: Prompt injection運用メモ
**Status: NOTE**

### SANITIZE_MODE（運用逃げ道）
- `SANITIZE_MODE` は `1/true/yes/on` を True として判定
- `SANITIZE_MODE=1` の場合、`/summarize` で `glossary_text` / `summary_prompt` に注入検知があっても破棄して続行
- `text` は注入検知時に引き続きリジェクト（安全優先）
- 破棄した場合はレスポンスの `warnings` に `glossary_text_dropped` / `summary_prompt_dropped` を含める

### /generate_title の長さ仕様
- `/generate_title` は **先頭500文字のみで処理**し、長さ超過(413)は返さない設計

### 誤検知耐性の改善案（提案）
- `text` は会話ログ/コード引用で `system:` などが混入しやすい
- 現行ルールは維持しつつ、運用上は **textの検知を弱める / glossary_text と summary_prompt を強める** 方向が有効
- 将来的にはフィールド別に `dangerous_patterns` を分離し、`text` 用は緩和ルールにする運用を推奨

### セキュリティ達成レベル

| 項目 | 状態 |
|------|------|
| Firebase Auth IDトークン検証 | ✅ 実装済み |
| 本番環境でDEBUG_AUTH_BYPASS無効 | ✅ 実装済み |
| OpenAI API呼び出しの保護 | ✅ 実装済み |
| Firestore書き込みの保護 | ✅ 実装済み |
| ADCによる認証（キー埋め込みなし） | ✅ 実装済み |

### 次フェーズ（推奨）

1. **レート制限**
   - 1ユーザーあたりのリクエスト数制限（例: 10 req/min）
   - Cloud Armor または アプリレベルで実装

2. **課金連携強化**
   - /token 呼び出し時にも残り時間チェック
   - ジョブ未完了時の自動タイムアウト処理

3. **監査ログ**
   - 認証失敗の詳細ログ（IP、User-Agent等）
   - 不審なアクセスパターンの検知

4. **トークン有効期限**
   - Firebase IDトークンの有効期限確認（デフォルト1時間）
   - 必要に応じてリフレッシュ処理をフロントに追加

---

## S9: Frontend Firebase Auth Implementation (Resume)
**Status: DONE**

### 問題発見 (2026-01-10)
DEPLOY_STATE.jsonのP1-1には「Firebase SDK追加」と記録されていたが、
実際のstatic/app.jsとstatic/index.htmlにはFirebase Auth関連コードが**欠落**していた。

結果：バックエンドは401を返すが、フロントエンドは認証トークンを付与しない→アプリ動作不能

### 修正内容
1. static/index.html に Firebase SDK CDN を追加
2. static/index.html に ログイン/ログアウトボタンを追加（最小UI変更）
3. static/app.js に Firebase初期化・authFetch関数を追加
4. 全API呼び出しをauthFetch経由に変更

### 修正対象ファイル
- static/index.html
- static/app.js
- static/styles.css

### 実施した変更

#### static/index.html
- Firebase SDK (v10.7.1) をCDN経由で追加
- auth-area: ログイン/ログアウトボタン、ユーザーメール表示を追加

#### static/app.js
- firebaseConfig: Firebase設定（appIdはユーザーが設定必要）
- auth: Firebase Auth初期化
- currentUser: ログイン中ユーザー
- getAuthToken(): Firebase IDトークン取得
- authFetch(): Authorization Bearerヘッダー付きfetch
- onAuthStateChanged(): 認証状態監視、UI更新
- ログイン: Google Sign-In popup
- ログアウト: auth.signOut()

#### API呼び出し変更
| 元 | 変更後 |
|----|--------|
| fetch('/token', ...) | authFetch('/token', ...) |
| fetch('/translate', ...) | authFetch('/translate', ...) |
| fetch('/summarize', ...) | authFetch('/summarize', ...) |
| fetch('/audio_m4a', ...) | authFetch('/audio_m4a', ...) |

### 同期
```bash
rm -rf public/* && cp -R static/* public/
```

### 差分確認
```
 static/app.js        |  89 +++++++++++++++++++++
 static/index.html    |  18 +++--
 static/styles.css    |  15 ++++
```

---

## S10: Final Verification Checklist
**Status: PENDING**

### 前提条件
1. Firebase Console で Google Sign-In を有効化済み
2. firebaseConfig の appId を正しく設定済み

### テスト手順

#### ローカル確認
```bash
cd public && python3 -m http.server 8080
# http://localhost:8080 をブラウザで開く
```

#### 動作確認チェックリスト
- [ ] ページが白画面にならず表示される
- [ ] ログインボタンが表示される
- [ ] Startボタンが無効（ログイン前）
- [ ] ログインボタン押下 → Google Sign-In popup
- [ ] ログイン後、メールアドレス表示 + ログアウトボタン表示
- [ ] ログイン後、Startボタンが有効
- [ ] Start押下 → /token API呼び出し（Authorization Bearer付き）
- [ ] 翻訳が動作する
- [ ] Stop押下 → ダウンロードリンク生成

---

## Deploy Commands (S11)
**Status: PENDING - ユーザー許可待ち**

### Firebase Hosting
```bash
cd "/Users/nakamurayoshiki/Documents/Vibe Coding/realtime-translator-pwa-main"
firebase deploy --only hosting
```

### 注意事項
- **Cloud Run再デプロイは不要**（バックエンドは既にS7でデプロイ済み）
- Firebase Hostingのみデプロイ
