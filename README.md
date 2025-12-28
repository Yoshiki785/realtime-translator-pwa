# Realtime Translator PWA (Vanilla + FastAPI)

## 最短起動手順
1. 依存インストール: `pip install -r requirements.txt`
2. 環境変数をセット: `export OPENAI_API_KEY=sk-...`
   - これは**ターミナルで実行するコマンド**です（bash/zsh）。PowerShell は `setx OPENAI_API_KEY "sk-..."`、cmd.exe は `set OPENAI_API_KEY=sk-...` を使用してください。
3. サーバ起動: `uvicorn app:app --host 0.0.0.0 --port 8000`
4. ブラウザで `http://localhost:8000` を開く（`/static` 配下は自動提供、service worker は `/sw.js` で登録）。

## 構成と配置
```
.
├─ app.py                 # FastAPI メイン。/token /translate /summarize /audio_m4a
├─ requirements.txt
├─ static/
│  ├─ index.html          # シンプル1画面 UI
│  ├─ app.js              # PWA ロジック（WebRTC + Realtime 接続、録音、翻訳、DL）
│  ├─ styles.css          # モバイル最適化スタイル
│  ├─ manifest.json       # PWA manifest
│  ├─ sw.js               # Service Worker (cache)
│  ├─ icon-192.png        # PWA アイコン（起動時に自動生成）
│  └─ icon-512.png        # 同上
└─ downloads/             # m4a 変換結果など（起動時自動作成）
```

## 使い方
- **Start**: マイク権限を取得し、Realtime へ WebRTC で接続。字幕（原文）が delta で更新され、**確定（completed または gap）後に原文ログへ保存し、その原文のみを翻訳**します。
- **Stop**: 接続を終了し、録音した webm をダウンロードリンク化。バックエンドで m4a 変換 `/audio_m4a` にも送信し、m4a リンクも生成。原文/日英/要約ファイルも生成します。
- **設定 (⚙︎)**: maxChars（表示上限）、gapMs（無音区切り）、vadSilence（/token に渡す server_vad 値）を保存。変更は次回接続から反映。
- **PWA**: 初回アクセスで service worker が登録され、ホーム追加ガイドが一度だけ表示されます。

## バックエンド API
- **POST /token**: OpenAI Realtime の client secret を代理発行。`vad_silence` を turn_detection.silence_duration_ms に反映。レスポンス形式は `{ "client_secret": "..." }`（フラットな文字列のみ返却）。
- **POST /translate**: Responses API で日本語訳のみ返却。
- **POST /summarize**: Responses API で Markdown 要約を返却。
- **POST /audio_m4a**: webm を受け取り ffmpeg で m4a へ変換し、`/downloads/...` の URL を返却。

## 環境メモ
- 必須 env: `OPENAI_API_KEY`（bash/zsh は `export OPENAI_API_KEY=sk-...`、PowerShell は `setx OPENAI_API_KEY "sk-..."`、cmd.exe は `set OPENAI_API_KEY=sk-...`）。
- ffmpeg が PATH にある必要があります（`ffmpeg -version` で確認）。
- デフォルト設定: maxChars=300, gapMs=1000, vadSilence=400（UIで上書き保存され、localStorage に保持）。
- 長いログはフロント側で maxChars で末尾優先トリムします（表示用）。翻訳は原文確定後に個別に取得します。
- PWA アイコンは起動時に base64 文字列から生成されるため、リポジトリにはバイナリを含めていません（CI/PR で「バイナリ非対応」と怒られないようにするため）。

## PWA インストール手順
1. Chrome/Edge/Safari で `http://localhost:8000` を開く。
2. アドレスバーのインストールアイコン、または iOS Safari の「共有」→「ホーム画面に追加」を選ぶ。
3. 初回のみ画面下部に「ホーム画面に追加」案内が表示されます。

## ngrok で公開する（Colab など）
オプションで以下を実行すると外部公開できます。
```python
!pip install ngrok
import os, subprocess, textwrap, json, requests
os.environ['OPENAI_API_KEY'] = 'sk-...'
server = subprocess.Popen(['uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'])
!ngrok http 8000 --log=stdout &
```
表示された URL（例: https://xxxx.ngrok.io）にスマホからアクセスして PWA をインストールできます。

## よくあるエラーと対処
- **token取得に失敗**: OPENAI_API_KEY が設定されているか確認。サーバログに OpenAI API のレスポンスが出ます。
- **client secret missing**: /token のレスポンスに client_secret が含まれていない場合に表示されます。OPENAI_API_KEY が無効/期限切れでないか、組織のポリシーで Realtime が許可されているか確認してください。
- **マイク拒否**: ブラウザのマイク許可をオンにしてください。
- **Realtime error**: ネットワークや WebRTC ブロックが無いか確認。再度 Start してください。
- **m4a変換失敗**: ffmpeg が無い、または webm データが破損している可能性があります。`ffmpeg -version` を確認し、再録音してください。
- **オフライン起動できない**: ブラウザのキャッシュをクリアして `/sw.js` を再登録（再読み込み）してください。service worker はルートに登録され、`/` もキャッシュ対象です。

## リアルタイム処理の流れ
- フロントエンドは WebRTC で接続し、DataChannel で `conversation.item.input_audio_transcription.delta/completed` を受信します。
- delta は item_id ごとに蓄積し、画面の原文行にライブ表示します。gapMs 以上の無音、または completed で確定すると原文ログに追記し、その文だけを /translate に送り日本語行へ反映します。
- WebRTC のオファーは `POST https://api.openai.com/v1/realtime/calls`（Content-Type: application/sdp, Authorization: Bearer <client_secret>）で交換します。

## 動作確認ポイント
1. `/` を開き、Start → マイク許可。
2. 話すと上段の原文がリアルタイム更新（delta 蓄積）。
3. 話し終える or 無音 gap で原文がログに確定し、その後に日本語訳が追記される。
4. Stop で webm ダウンロードリンク、m4a（成功時）、原文/バイリンガル/要約のリンクが並ぶ。
5. PWA としてホーム追加し、オフラインでも `/` がキャッシュされることを確認（`/sw.js` 登録済み）。
