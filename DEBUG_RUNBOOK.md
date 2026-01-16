# DEBUG_RUNBOOK.md

## Issue
Startを押してもリアルタイム翻訳が始まらない（ログインは成功する）

## Environment
- Hosting: https://realtime-translator-pwa-483710.web.app
- Cloud Run: https://realtime-translator-api-853238768850.asia-northeast1.run.app/
- Project: realtime-translator-pwa-483710
- Region: asia-northeast1

---

## D0: Initialize debug state/runbook
**Status: DONE**

- DEBUG_STATE.json created
- DEBUG_RUNBOOK.md created

---

## D1: Collect endpoints + start flow in frontend
**Status: DONE**

### Startボタンのフロー（static/app.js）
1. **イベント登録**: 484行目 `els.start.addEventListener('click', start);`
2. **start関数（408-451行）**の呼び出し順序:
   - `createJob()` → `authFetch('/api/v1/jobs/create')` ✅ 認証付き
   - `fetch('/token')` → **通常fetch (認証なし)** ❌ 問題箇所！
   - `negotiate(clientSecret)` → OpenAI Realtime APIへ接続

### 認証漏れの発見
| エンドポイント | 使用関数 | 認証 |
|--------------|---------|-----|
| `/api/v1/jobs/create` | authFetch | ✅ |
| `/api/v1/jobs/complete` | authFetch | ✅ |
| `/token` (433行) | fetch | ❌ |
| `/translate` (253行) | fetch | ❌ |
| `/summarize` (175行) | fetch | ❌ |
| `/audio_m4a` (159行) | fetch | ❌ |

**結論**: `/token` が認証なしで呼ばれているため、バックエンドが認証を必要としている場合は失敗する可能性が高い

---

## D2: Verify Hosting rewrites reach Cloud Run
**Status: DONE**

```
$ curl -I https://realtime-translator-pwa-483710.web.app/token
HTTP/2 405
allow: POST
content-type: application/json
server: Google Frontend

$ curl -I https://realtime-translator-pwa-483710.web.app/translate
HTTP/2 405
allow: POST
content-type: application/json
server: Google Frontend
```

**結果**: ✅ 両エンドポイントとも405 (Method Not Allowed - POST required)を返しており、Cloud Runに正しく到達している。HTMLが返っていないのでrewritesは正常動作

---

## D3: Check Cloud Run logs for errors
**Status: DONE**

```
2026-01-10 09:14:50 INFO:     Uvicorn running on http://0.0.0.0:8080
2026-01-10 09:14:50 "GET /token HTTP/1.1" 405 Method Not Allowed
2026-01-10 09:14:51 "GET /translate HTTP/1.1" 405 Method Not Allowed
```

**結果**:
- 致命的なエラー（500系、OPENAI_API_KEY未設定等）は見られない
- GETの405は正常動作（POSTが必要）
- **POSTリクエストのログがない** → フロントエンドレベルでブロックされている可能性
  - `createJob()` (authFetch)が失敗しているか
  - もしくはFirebase認証自体が失敗している可能性

---

## D4: Check Cloud Run env presence
**Status: DONE**

```
$ gcloud run services describe realtime-translator-api --region asia-northeast1 \
    --format="yaml(spec.template.spec.containers[0].env)"
null
```

**結果**: ⚠️ **環境変数が設定されていない**

Cloud Runにはまだ環境変数が設定されていません。ただし、現在POSTリクエストがCloud Runに到達していないため、環境変数の問題は表面化していません。

**設定が必要な環境変数（推定）**:
- `OPENAI_API_KEY`
- （他にFirebase関連があれば追加）

**設定コマンド（ユーザーが実行）**:
```bash
gcloud run services update realtime-translator-api \
  --region asia-northeast1 \
  --set-env-vars OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
```

---

## D5: Fix frontend error handling + visible diagnostics
**Status: DONE**

### 修正内容
1. `/token` 呼び出しを `authFetch` に変更（認証付きに）
2. ステータス表示追加（Creating job..., Requesting token..., Connecting...）
3. エラー時にステータスコードを含む詳細表示（例: `/token 500: ...`）
4. `console.error` にもログ出力

---

## D6: Ensure authFetch is applied to all internal API calls
**Status: DONE**

### 変更したエンドポイント
| エンドポイント | 変更前 | 変更後 |
|--------------|--------|--------|
| `/token` | fetch | authFetch ✅ |
| `/translate` | fetch | authFetch ✅ |
| `/summarize` | fetch | authFetch ✅ |
| `/audio_m4a` | fetch | authFetch ✅ |
| `/api/v1/jobs/create` | (既にauthFetch相当) | authFetch ✅ |
| `/api/v1/jobs/complete` | (既にauthFetch相当) | authFetch ✅ |

### Diff (static/app.js)
```diff
-const res = await fetch('/token', { method: 'POST', body: fd });
+const res = await authFetch('/token', { method: 'POST', body: fd });

-const res = await fetch('/translate', { method: 'POST', body: fd });
+const res = await authFetch('/translate', { method: 'POST', body: fd });

-const summaryRes = await fetch('/summarize', {...});
+const summaryRes = await authFetch('/summarize', {...});

-const res = await fetch('/audio_m4a', { method: 'POST', body: fd });
+const res = await authFetch('/audio_m4a', { method: 'POST', body: fd });
```

---

## D7: Redeploy hosting
**Status: DONE**

```
$ rm -rf public/* && cp -R static/* public/
$ firebase deploy --only hosting

✔  Deploy complete!
Hosting URL: https://realtime-translator-pwa-483710.web.app
```

7ファイルをデプロイ完了

---

## D8: Verification checklist + next steps
**Status: DONE**

### 原因と修正の総括

1. **根本原因1（致命的）**: `index.html` のパスが `/static/app.js` 等になっていたが、Firebase Hostingでは `/app.js` であるべき → **app.jsが読み込まれず、全ボタンが反応しなかった**
2. **根本原因2**: `/token`, `/translate`, `/summarize`, `/audio_m4a` が認証なしの `fetch()` で呼ばれていた
3. **修正1**: パスを `/static/xxx` → `/xxx` に変更（manifest.json, icon, styles.css, app.js）
4. **修正2**: 全エンドポイントを `authFetch()` に統一
5. **追加**: エラー発生時にステータスコードと詳細をUIに表示するよう改善

### 検証チェックリスト

- [ ] https://realtime-translator-pwa-483710.web.app にアクセス
- [ ] Googleログインを実行
- [ ] Startボタンを押す
- [ ] 「Creating job...」→「Requesting token...」→「Connecting...」→「Listening」と進むことを確認
- [ ] エラーが出る場合は、画面に表示されるエラーメッセージを確認（例: `/token 500: OPENAI_API_KEY not configured`）

### 追加で修正した問題

**D9: Firestore API有効化 + データベース作成**

「ジョブ作成に失敗しました」エラーの原因:
- Cloud Firestore APIが有効化されていなかった
- Firestoreデータベースが存在しなかった

修正:
```bash
gcloud services enable firestore.googleapis.com --project=realtime-translator-pwa-483710
gcloud firestore databases create --project=realtime-translator-pwa-483710 --location=asia-northeast1
```

結果: ✅ Firestoreデータベース作成完了（asia-northeast1, FIRESTORE_NATIVE）

---

### D10: app.py logger bugfix

**問題**: `logger.info(..., extra=json.dumps({...}))` で `extra` に文字列を渡していた。
Python の `logger` は `extra` に dict を期待するため TypeError が発生。

**修正**: `extra=json.dumps({...})` を削除し、メッセージ内にJSONを埋め込む方式に変更

```python
# Before
logger.info(f"Job created", extra=json.dumps({"uid": uid, ...}))

# After
logger.info(f"Job created | {json.dumps({'uid': uid, ...})}")
```

修正箇所: app.py 内の18箇所
- `extra=json.dumps({...})` → メッセージ内埋め込み (16箇所)
- `extra="{}"` → 削除 (8箇所)

---

### 次のステップ（必要に応じて）

**1. Cloud Runに環境変数を設定（OPENAI_API_KEY未設定の場合）**
```bash
gcloud run services update realtime-translator-api \
  --region asia-northeast1 \
  --set-env-vars OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
```

**2. バックエンドでFirebase IDトークン検証を追加（APIを保護する場合）**
```python
# main.py（Cloud Run）に追加
from firebase_admin import auth, initialize_app
initialize_app()

def verify_firebase_token(authorization: str):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization[7:]
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(401, "Invalid token")
```

