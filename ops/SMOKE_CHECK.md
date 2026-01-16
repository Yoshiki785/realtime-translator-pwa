# Smoke Check Guide

> **Cloud Run Known Issue**: Paths ending with `z` (e.g., `/healthz`) are reserved by Cloud Run infrastructure. Use `/health` instead.

## API_BASE の決め方
- **Cloud Run URL (推奨)**: `https://realtime-translator-api-853238768850.asia-northeast1.run.app` は `/health` を直接返すため、最も確実です。
- Firebase Hosting (`https://realtime-translator-pwa-483710.web.app`) を使う場合は Cloud Run への rewrite が必要。404 の場合は Cloud Run URL を指定してください。

## 手動実行
```bash
cd /Users/nakamurayoshiki/Documents/Vibe\ Coding/realtime-translator-pwa-main
API_BASE="https://realtime-translator-api-853238768850.asia-northeast1.run.app" ./scripts/smoke_check.sh

# 認証つきで追加チェックを走らせる場合（Firebase ID token を使用）
# 1) ブラウザでアプリにログイン
# 2) DevTools Console で以下を実行して ID token を取得（例）
#    await firebase.auth().currentUser.getIdToken(true)
# 3) 取得した文字列を TOKEN に入れて実行（TOKENは出力しない）

TOKEN="(paste-firebase-id-token-here)" \
API_BASE="https://realtime-translator-api-853238768850.asia-northeast1.run.app" ./scripts/smoke_check.sh
```
`TOKEN` は必要なときだけ設定し、端末に表示しないこと。

## launchd への登録 (10分間隔)
```bash
cp ops/launchd/com.yoshiki.rttranslator.smokecheck.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.yoshiki.rttranslator.smokecheck.plist
```
- `ProgramArguments` の `API_BASE="..."` を自身の環境に合わせて編集。
- ログ: `ops/logs/smokecheck.out` / `ops/logs/smokecheck.err`

### アンインストール
```bash
launchctl unload ~/Library/LaunchAgents/com.yoshiki.rttranslator.smokecheck.plist
rm ~/Library/LaunchAgents/com.yoshiki.rttranslator.smokecheck.plist
```

## トラブルシューティング
- `health request failed` or 404 → `API_BASE` が Hosting で `/health` rewrite が無い可能性。Cloud Run URL に変更。
- `python3 is required` → macOS に python3 をインストール。
- 認証付きチェックで 401 → `TOKEN` の期限切れ。再取得し、`TOKEN` をログに出さない。

## launchd 更新後の確認
- `launchctl list | grep smokecheck` で登録確認。
- `tail -f ops/logs/smokecheck.out` で結果を監視。
