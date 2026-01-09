# Firebase Hosting + Cloud Run Deployment Runbook

## Project Info
- Project ID: realtime-translator-pwa-483710
- Region: asia-northeast1
- Cloud Run Service: realtime-translator-api
- Cloud Run URL: https://realtime-translator-api-853238768850.asia-northeast1.run.app/

## Deployment Steps

### S0: Initialize state/runbook - DONE
- Created DEPLOY_STATE.json with step tracking
- Created DEPLOY_RUNBOOK.md for operation log
- Resume position: S1 (first PENDING step)

### S1: Repo sanity check - DONE
- pwd: /Users/nakamurayoshiki/Documents/Vibe Coding/realtime-translator-pwa-main ✓
- firebase.json exists, current config: SPA only (** -> /index.html)
- static/ and public/ directories present

### S2: Sync static -> public - DONE
- Removed public/* (was: app.js, index.html, manifest.json, icons, sw.js, styles.css)
- Copied static/* to public/ (9 files total)
- Verified: public/index.html exists, correct content

### S3: Update firebase.json rewrites - DONE
- Diff: Added 5 Cloud Run rewrites BEFORE SPA fallback
  - /audio_m4a -> realtime-translator-api (asia-northeast1)
  - /summarize -> realtime-translator-api (asia-northeast1)
  - /translate -> realtime-translator-api (asia-northeast1)
  - /token -> realtime-translator-api (asia-northeast1)
  - /api/** -> realtime-translator-api (asia-northeast1)
  - ** -> /index.html (SPA fallback, MUST be last)

### S4: Deploy Firebase Hosting - FAILED

**ERROR FULL TEXT:**
```
Error: Request to https://firebasehosting.googleapis.com/v1beta1/projects/-/sites/realtime-translator-pwa/versions/6ae467425415d90b?updateMask=status%2Cconfig had HTTP Error: 403, Cloud Run Admin API has not been used in project 416549874702 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/run.googleapis.com/overview?project=416549874702 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.
```

**原因仮説（最大2）:**
1. Firebase Hosting のデフォルトプロジェクト (416549874702) で Cloud Run Admin API が未有効化
2. .firebaserc で指定しているプロジェクトと、実際のCloud RunサービスがあるGCPプロジェクト (realtime-translator-pwa-483710) が異なる可能性

**次の具体手順（最大2）:**
1. .firebaserc を確認し、正しいプロジェクトID (realtime-translator-pwa-483710) が設定されているか検証
2. 必要に応じて `firebase use realtime-translator-pwa-483710` でプロジェクト切り替え、または GCP Console で project 416549874702 の Cloud Run Admin API を有効化

**修復アクション実施:**
- 実行: `firebase use realtime-translator-pwa-483710` → Success
- プロジェクトに Firebase リソースが未設定だったため追加実施:
  - `gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com`
  - `firebase projects:addfirebase realtime-translator-pwa-483710`
- Hosting site 自動作成: realtime-translator-pwa-483710
- 再デプロイ成功: 7 files uploaded, version finalized, release complete
- Hosting URL: https://realtime-translator-pwa-483710.web.app

### S5: Capture hosting URL - DONE
- Extracted from S4 deploy output: https://realtime-translator-pwa-483710.web.app
- Saved to DEPLOY_STATE.json hosting_url field

### S6: Smoke test via Hosting - DONE (PASS)

**Test: curl -I https://realtime-translator-pwa-483710.web.app/**
- Status: HTTP/2 200 ✓
- Content-Type: text/html; charset=utf-8 ✓
- Content-Length: 2776 (index.html served) ✓

**Test: curl -I https://realtime-translator-pwa-483710.web.app/translate**
- Status: HTTP/2 405 (Method Not Allowed) ✓
- Headers: allow: POST, server: Google Frontend, x-cloud-trace-context present
- Analysis: Cloud Run reached successfully (not 404, not index.html fallback) ✓

**PASS Condition Met:**
- ✓ Hosting "/" returns HTTP 200
- ✓ Hosting "/translate" is NOT 404 (Cloud Run reachability confirmed)
- ✓ Hosting "/translate" does NOT return index.html (SPA rewrites not intercepting API paths)

### S7: Compare with Cloud Run direct - DONE

**Cloud Run Direct: curl -I https://realtime-translator-api-853238768850.asia-northeast1.run.app/translate**
- Status: HTTP/2 405
- Headers: allow: POST, server: Google Frontend

**Comparison:**
- Hosting経由: HTTP/2 405, allow: POST ✓
- Cloud Run直接: HTTP/2 405, allow: POST ✓
- **Result: MATCH** - Firebase Hosting rewrites correctly proxy to Cloud Run

### S8: Final summary - DONE

## Deployment Result: PASS ✓

**What Was Accomplished:**
1. Firebase Hosting と Cloud Run を同一プロジェクト (realtime-translator-pwa-483710) に統合
2. PWA フロント (static/) を Firebase Hosting (public/) で配信
3. firebase.json rewrites 設定: API paths → Cloud Run, SPA fallback → index.html
4. デプロイ成功: https://realtime-translator-pwa-483710.web.app
5. スモークテスト PASS:
   - ルート (/) が HTTP 200 で HTML を返す
   - API paths (/translate) が Cloud Run に到達 (405 Method Not Allowed)
   - SPA rewrites が API paths を横取りしていない
6. Hosting経由と直接アクセスの応答が一致（rewrites 正常動作確認）

**Current Architecture:**
```
User → Firebase Hosting (realtime-translator-pwa-483710.web.app)
         ├─ /audio_m4a, /summarize, /translate, /token, /api/** → Cloud Run (asia-northeast1)
         └─ ** → /index.html (SPA fallback)
```

**Next Recommended Action:**
Firebase Authentication 統合でセキュリティ強化:
1. Firebase Authentication を有効化（Email/Password, Google Sign-In等）
2. フロントエンド: ログイン後に ID Token を取得し、API リクエストの Authorization ヘッダーに付与
3. FastAPI バックエンド: Firebase Admin SDK で ID Token を検証し、認証済みユーザーのみアクセス許可
4. Cloud Run の ingress を `internal-and-cloud-load-balancing` に設定し、直接アクセスを制限

**Resume Method (リミット対策):**
作業が中断された場合は、DEPLOY_STATE.json を読み取り、status が PENDING または FAILED のステップから再開してください。
すべてのステップが DONE の場合、このデプロイは完了しています。

---
