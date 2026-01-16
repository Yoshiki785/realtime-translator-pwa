# AUTH_FIX_RUNBOOK.md

## 根本原因
**firebase-config.jsのapiKey（prefix: AIzaSyDk）が無効または別プロジェクトのもの**

加えて、プロジェクトID不一致が検出された：
- `.firebaserc`: `realtime-translator-pwa`
- `firebase-config.js`: `realtime-translator-pwa-483710`

## 現象
- PWAでログインボタンを押しても反応しない
- エラー: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`
- UIは青い画面で表示される（DOM/イベントは生きている）
- 設定ボタンは正常に動作

## 重要制約（AI_WORKFLOW.mdより）
1. **ソースは`static/`のみ編集** - `public/`は直接編集禁止
2. **同期手順**: `rm -rf public/* && cp -R static/* public/`
3. **秘密情報は出力しない** - apiKeyは先頭数文字のみ
4. **デプロイはユーザー実行** - コマンド提示のみ（明示的指示時のみ実行可）
5. **SW更新時はキャッシュ名をバンプ**
6. **必須ファイル確認**: index.html, app.js, styles.css, manifest.json, sw.js

---

## S0) 初期化
- [x] AI_WORKFLOW.md読了
- [x] AUTH_FIX_STATE.json作成
- [x] AUTH_FIX_RUNBOOK.md作成

## S1) URL/配信物確認
- 対象URL: `https://realtime-translator-pwa.web.app` (推定)
- Hostingディレクトリ: `public`
- .firebasercプロジェクト: `realtime-translator-pwa`
- configのprojectId: `realtime-translator-pwa-483710` ← **不一致！**

## S2) Firebase初期化の二重化調査
- **firebaseConfig定義箇所**:
  - `static/firebase-config.js:4` → `window.FIREBASE_CONFIG` (実際に使用される)
  - `static/app.js:3` → `const firebaseConfig` (未使用のフォールバック - 削除推奨)
- **initializeApp呼び出し**: `static/app.js:66` - `firebase.initializeApp(runtimeFirebaseConfig)`
- **init.js混入**: なし（`/__/firebase/init.js` は使用していない）
- **useEmulator**: なし

## S3) firebaseConfig整合性
| 項目 | firebase-config.js | app.js (未使用) |
|------|-------------------|-----------------|
| apiKey prefix | AIzaSyDk | AIzaSyB2 |
| authDomain | realtime-translator-pwa-483710.firebaseapp.com | 同左 |
| projectId | realtime-translator-pwa-483710 | 同左 |
| storageBucket | realtime-translator-pwa-483710.firebasestorage.app | 同左 |
| messagingSenderId | 853238768850 | 同左 |
| appId | 1:853238768850:web:0b51c306f3602f6a34f90b | 同左 |

**問題**: apiKeyが異なる。firebase-config.jsのキー(AIzaSyDk...)が`auth/api-key-not-valid`エラーを起こしている。

## S4) 修正方針
- ユーザー確認により、`app.js`のapiKey（AIzaSyB2...）が正しいと判明
- `static/firebase-config.js`のapiKeyをAIzaSyDk...→AIzaSyB2...に修正
- `static/app.js`の未使用`const firebaseConfig`を削除（混乱防止）

## S5) ログイン処理確認
- ログインボタンハンドラ: `static/app.js:551-562`（行番号は修正後）
- 方式: `signInWithPopup` (GoogleAuthProvider)
- エラー表示: あり（秘密情報なし）
- 修正後: 正しいapiKeyでFirebaseが初期化されるため動作するはず

## S6) static→public同期
```bash
rm -rf public/* && cp -R static/* public/
```
- 実行日時: 2026-01-11
- 結果: 成功
- 必須ファイル確認: index.html, app.js, styles.css, manifest.json, sw.js, firebase-config.js ✓

## S7) SWキャッシュ対策手順（デプロイ後に実行）
1. Chrome DevTools > Application > Service Workers > Unregister
2. Storage > Clear site data
3. Hard Reload（Disable cache ON）
4. シークレットウィンドウでも確認

## S8) デプロイ手順
```bash
firebase deploy --only hosting
```

---

## 修正ファイル一覧
1. `static/firebase-config.js` - apiKey修正（AIzaSyDk... → AIzaSyB2...）
2. `static/app.js` - 未使用のfirebaseConfig定数を削除

---

## 検証チェックリスト（デプロイ後）
- [ ] ログインボタンを押すとGoogleログインポップアップが表示される
- [ ] ログイン成功後、ユーザー状態（メールアドレス表示、ログアウトボタン）が反映される
- [ ] auth/api-key-not-validエラーが消える
- [ ] UIデザイン（青画面）が維持されている
- [ ] Startボタンが動作する（ログイン後）

---

## トラブルシュート
**ログインポップアップが出ない場合:**
- Firebase Console → Authentication → Sign-in method → Google が有効か確認
- Authorized domains に `realtime-translator-pwa-483710.web.app` が含まれているか確認

**まだエラーが出る場合:**
- ブラウザのSWキャッシュをクリア（S7の手順）
- シークレットウィンドウで確認
