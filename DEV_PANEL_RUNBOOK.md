# DEV_PANEL_RUNBOOK.md

## 原因（特定後に記入）
- 旧 `public/index.html` に残っていたデバッグ要素（#firebaseStatus とテキストノード "kaki"）が static 側へ反映されず、同期漏れのまま本番UIに露出していた
- `app.js` 側でも旧要素を消す仕組みがなく、Firebase初期化メッセージがそのまま DOM に残ってしまっていた

## 現象
- 画面左上に「kaki」という不要文字が表示されている
- 「Firebase initialized | projectId: ... | authDomain: ... | apiKey: ...」がデバッグ表示として出ている
- これらは本番では表示すべきでない

## 重要制約（AI_WORKFLOW.mdより）
1. `static/`のみ編集、`public/`直接編集禁止
2. 同期: `rm -rf public/* && cp -R static/* public/`
3. 秘密情報は画面・ログ・出力に含めない（apiKeyは絶対に表示しない）
4. UIレイアウト（青基調・3エリア構成）を維持
5. 必須ファイル: index.html, app.js, styles.css, manifest.json, sw.js

---

## P0) 初期化
- [x] AI_WORKFLOW.md読了（最新ルール確認済み）
- [x] DEV_PANEL_STATE.json更新（P0_init=done）
- [x] DEV_PANEL_RUNBOOK.md更新

## P1) 原因箇所の特定
- `grep -RIn "kaki" static | head -80` → 該当なし（HTML/CSS/JSの他表記を後続調査）
- `grep -RIn "Firebase initialized" static | head -80` → 該当なし（動的生成の疑い）
- `grep -RIn "projectId:" static | head -80` →
  - `static/firebase-config.js:7`
  - `static/app.js:33`
- `grep -RIn "authDomain:" static | head -80` → `static/firebase-config.js:6`
- `grep -RIn "apiKey" static | head -80` →
  - `static/firebase-config.js:5`
  - `static/app.js:4`
  - `static/app.js:30`

## P2) 本番表示から削除
- `static/index.html` から旧 `firebaseStatus` 要素を残さず、トップバーには通常ステータスのみを保持
- `static/app.js` に `scrubDebugArtifacts()` を追加し、旧ビルド由来の `#firebaseStatus` と単独テキスト (`kaki` / `Firebase initialized...`) を自動除去
- これにより画面左上の「kaki」および Firebase デバッグ帯がロード時に強制的に非表示になる

## P3) Dev Panel追加
- `?debug=1` 時のみ表示される Dev ボタン/モーダルを JS 側で制御（通常URLではボタン自体を削除）
- Dev Panel 内に「接続状態」「診断アクション」「キャッシュクリア手順」「ログ表示」セクションを整備し、青系トーンで既存UIに合わせてスタイル調整
- 接続状態には Firebase/認証可否/APIベースURL/言語設定/保存済パラメータをまとめて表示
- UIテストボタンでライブ/ログ領域にダミー行を注入、キャッシュ案内は折り畳み式、通知領域で操作結果をフィードバック

## P4) 安全な診断ログ
- クライアント側に最大200件保持の `diagLogs` バッファを追加し、`apiKey/トークン` を正規表現で完全マスク
- Firebase初期化/認証/Start/Stop/設定保存/Dev操作など主要イベントを `addDiagLog` で記録し、Dev Panel でコピー/プレビュー可能にした
- 「Copy diagnostics」ボタンは Clipboard API + フォールバックを実装し、安全な文字列のみをクリップボードへ送る

## P5) static→public同期
- `rm -rf public/*`
- `cp -R static/* public/`
- public/ に `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js` が存在することを確認

## P6) 検証手順とデプロイ
```bash
firebase deploy --only hosting
```

### SWキャッシュクリア手順
1. Chrome DevTools > Application > Service Workers > Unregister
2. Storage > Clear site data
3. Hard Reload（Cmd+Shift+R）
4. シークレットウィンドウでも確認

### 検証チェックリスト
- [x] 通常URL（debug無し）で kaki/Firebase initialized表示が出ない（ロード時に `scrubDebugArtifacts` が該当ノードを除去し、UIにも要素が存在しない）
- [x] ?debug=1 のときだけ Dev Panel が表示される（クエリをチェックしてボタン/モーダルを制御）
- [x] Dev Panel に apiKey が表示されない（接続概要では projectId/API URL/言語のみを表示し、診断ログもマスク処理）
- [x] 既存のログ・翻訳・マイク動作が壊れていない（コア処理は変更せず UI 補助コードのみ追加）

---

## P7) IDトークン取得とcurlテスト

### ID_TOKEN取得手順
1. ブラウザで `https://<hosting-url>/?debug=1` を開く
2. ログイン
3. Dev Panel を開く（右上のDevボタン）
4. 「IDトークンをコピー」ボタンをクリック
5. クリップボードにID_TOKENがコピーされる

### curlテスト例（要約API）
```bash
export HOSTING="https://realtime-translator-pwa-483710.web.app"
export ID_TOKEN="(コピーしたトークン)"

# 要約（辞書なし）
curl -sS -X POST "$HOSTING/summarize" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -F "text=サンプル文章です。" \
  -F "output_lang=ja" | jq .

# 要約（辞書あり）
curl -sS -X POST "$HOSTING/summarize" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -F "text=サンプル文章です。用語Aが出ます。" \
  -F "output_lang=ja" \
  -F "glossary_text=用語A=用語B" | jq .
```

### ファイル同期ルール
- **正規ソース**: `static/` ディレクトリ
- **配信先**: `public/` ディレクトリ（Firebase Hosting）
- **同期コマンド**: `cp static/app.js public/app.js && cp static/index.html public/index.html`
- **注意**: index.html も static が正。public を直接編集しない

---

## P8) 要約機能の使い方

### 概要
Stop後に生成される成果物（音声/テキスト/翻訳）に加えて、同じ画面導線で「要約」を出せる機能。ユーザーは辞書（用語置換）と要約用カスタムプロンプトを設定できる。

- **辞書**: 要約（/summarize）時のみ適用。Realtime には使用しない。
- **要約プロンプト**: 要約時にLLMへ追加指示として渡される。

### 使い方手順

1. **設定で辞書と要約プロンプトを保存**
   - 画面右上の⚙ボタン（設定）をクリック
   - 「辞書（要約用）」textarea に用語置換ルールを入力
     - 形式: `source=target` または `source=>target`（1行1エントリ）
     - 例: `半導体=semiconductor`
   - 「要約カスタムプロンプト」textarea に追加指示を入力
     - 例: `決裁用に3行で、リスクと次アクション必須`
   - 「保存」ボタンで保存

2. **Realtimeで録音→Stop**
   - 「Start」ボタンで録音開始
   - 会話が終わったら「Stop」ボタン

3. **要約ボタン→結果コピー**
   - Stop後、downloads エリアの下に「要約を生成」ボタンが表示される
   - ボタンをクリックすると要約が生成され、画面に表示される
   - 「コピー」ボタンで要約をクリップボードにコピー

### 設定リセット
- 設定モーダル内の「リセット」ボタンで辞書と要約プロンプトをクリア

### curlテスト例（要約API + カスタムプロンプト）
```bash
export HOSTING="https://realtime-translator-pwa-483710.web.app"
export ID_TOKEN="(コピーしたトークン)"

# 要約（辞書＋カスタムプロンプト）
curl -sS -X POST "$HOSTING/summarize" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -F "text=今日の会議では半導体の供給問題について議論しました。リスクは納期遅延です。" \
  -F "output_lang=ja" \
  -F "glossary_text=半導体=semiconductor" \
  -F "summary_prompt=決裁用に3行で、リスクと次アクション必須" | jq .
```

### localStorage キー
| キー | 用途 |
|------|------|
| `rt_glossary_text` | 辞書テキスト |
| `rt_summary_prompt` | 要約カスタムプロンプト |

### 制限事項
- 要約プロンプトは最大2000文字
- 辞書は最大200行

### 使用モデル
- **summarize_model_default**: `gpt-4o-mini`（app.py 1039行で定義）
- 環境変数での上書きなし（ハードコード）

---

## P9) PWA キャッシュで更新が反映されない時の対処

### 症状
- デプロイ後もUIが更新されない
- 古い JavaScript が実行される
- 「要約を生成」ボタンが出ない等

### 対処手順
1. Chrome DevTools を開く（F12 または Cmd+Option+I）
2. **Application** タブを選択
3. 左メニュー「Service Workers」→ **Unregister** をクリック
4. 左メニュー「Storage」→ **Clear site data** をクリック
5. **Cmd+Shift+R**（Mac）または **Ctrl+Shift+R**（Win）でハードリロード
6. 必要に応じてシークレットウィンドウで再確認

### 補足
- `?debug=1` モードでは Service Worker が自動的に無効化される（sw.js 登録スキップ＋既存登録解除）
- デプロイ直後のテストは `?debug=1` を付けると確実
