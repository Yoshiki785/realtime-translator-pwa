# Copilot 指示書 — realtime-translator-pwa

以下はこのリポジトリで AI コーディングエージェントが即戦力になるための最小限かつ具体的なガイドです。

## 1) プロジェクトの全体像（短く）
- バックエンド: `app.py`（FastAPI）。静的ファイルを `/static` で配信し、主要 API を提供する。
- フロントエンド: `static/index.html` + `static/app.js`（Vanilla JS、PWA、WebRTC + DataChannel を使い OpenAI Realtime と会話）。
- 出力/アセット: `downloads/` に生成された m4a 等を置く（起動時自動作成）。

## 2) 主要な責務とデータフロー
- 起動 -> `uvicorn app:app`。`/` で PWA を配信。
- フロントエンドが `/token` に POST して OpenAI Realtime の client secret を得る（Form: `vad_silence`）。
- フロントは WebRTC の Offer/Answer を `https://api.openai.com/v1/realtime/calls` に送り、DataChannel で `conversation.item.input_audio_transcription.delta` と `...completed` を受け取る。
- 確定された原文は `/translate`（Form: `text`）で翻訳、`/summarize`（Form: `text`）で要約を取得。
- 録音ファイルは `/audio_m4a`（multipart: `file`）へ送り、サーバ側で `ffmpeg` による m4a 変換を行う。

## 3) 起動・デバッグ手順（必須コマンド）
1. 依存インストール: `pip install -r requirements.txt`
2. 必須 env: `OPENAI_API_KEY`（例: `export OPENAI_API_KEY=sk-...`）。任意: `OPENAI_REALTIME_MODEL`。
3. サーバ起動: `uvicorn app:app --host 0.0.0.0 --port 8000`
4. ブラウザで `http://localhost:8000` を開く。
5. `ffmpeg` が PATH に必要（`ffmpeg -version` で確認）。

## 4) プロジェクト特有の実装パターン / 注意点
- `app.py` の `extract_output_text(result)` は Responses API の多様なレスポンス形状を吸収するユーティリティ。Responses の出力アクセスはここを使う。
- `/token` は OpenAI の client_secrets エンドポイントを呼ぶ代理エンドポイント。フロントは `data.value` を直接読む想定。
- フロント側 `static/app.js` は以下の設計を使う:
  - `partialByItem`（Map）で item 単位の delta を蓄積。
  - `gapMs`（無音閾値）で自動確定。確定後に `/translate` を呼ぶ。commit は `commitLog()`。
  - DataChannel の JSON ペイロードの `type` フィールドで分岐している（例: `conversation.item.input_audio_transcription.delta`）。
- サーバのエラーハンドリングは `HTTPException` と httpx の例外ハンドラでラップされている。外部 API 呼び出しは `post_openai()` を経由。

## 5) 変更を加えるときのチェックリスト
- 新しい外部依存（ffmpeg 以外）を追加したら `requirements.txt` を更新する。
- 静的資産の名前変更は `app.py` の `ensure_icon` と `StaticFiles` マウントに影響する。
- Realtime のモデル名変更は `OPENAI_REALTIME_MODEL` 環境変数を使うか、`app.py` の `realtime_model_default` を編集。

## 6) 具体的な API 使用例（実装の参考）
- `/token`: Form `vad_silence=400` を送ると JSON `{ "value": "<client_secret>" }` を得る。
- `/translate`: Form `text=Hello` → JSON `{ "translation": "こんにちは" }`。
- `/audio_m4a`: multipart form file field `file` に webm を入れて POST → JSON `{ "url": "/downloads/converted-....m4a" }`。

## 7) 追加情報・ファイル参照（開発時の最初の参照先）
- 動作概要: [README.md](README.md)
- サーバ実装: [app.py](app.py)
- フロント実装: [static/app.js](static/app.js)
- PWA service worker: [static/sw.js](static/sw.js)

## 8) TODO / 限界（現在のリポジトリで見つかった点）
- テストスイートが無いため、動作変更時は手動検証（起動 → マイク許可 → 発話）で確認する。
- GH 認証や CI は含まれていない（PR 作成時は `gh` CLI の設定が必要）。

フィードバックください: どの部分が詳しすぎる／足りないか教えてください。
