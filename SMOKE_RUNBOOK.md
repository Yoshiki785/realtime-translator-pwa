# SMOKE_RUNBOOK

## ゴール
- `/health` エンドポイントを FastAPI に追加し、認証なしでステータス確認可能にする。
- `scripts/smoke_check.sh` で手動/自動のスモークテストを実行。
- macOS launchd を使った定期実行（10分間隔）を ops 配下で管理。
- `SMOKE_STATE.json` で作業状態を追跡。

> **Cloud Run Known Issue**: Paths ending with `z` (e.g., `/healthz`) are reserved. Use `/health` instead.

## Steps
1. **S0**: 初期化 (`AI_WORKFLOW.md` 読了、state/runbook作成)
2. **S1**: `/health` 実装（service/version/timeを返すJSON）
3. **S2**: `scripts/smoke_check.sh`
4. **S3**: launchd plist + ドキュメント
5. **S4**: `ops/logs` 等の構造整備
6. **S5**: 差分と実行方法の共有

各ステップ完了後に本RUNBOOKへ実装メモを記載すること。

---

## S1) /health 実装
- `app.py` に `SERVICE_NAME`/`APP_VERSION` 定数を追加し、環境変数/COMMIT_SHA/ローカルからバージョン情報を検出。
- `/health` は `{ ok: true, service, version, time }` を JSON で返し、Hosting/Cloud Run 両方で軽量に応答可能。

## S2) `scripts/smoke_check.sh`
- `API_BASE` 必須で `/health` を確認。`TOKEN` がある場合のみ `/api/v1/me`・`jobs/create`・`jobs/complete` の順で認証フローを実行。
- jq が無い環境でも `python3` を使って JSON を検証。Bearer Token は `Authorization` ヘッダにのみ設定し、ログ出力は PASS/FAIL の簡潔な文言のみ。

## S3) launchd + ドキュメント
- `ops/launchd/com.yoshiki.rttranslator.smokecheck.plist` を追加。`StartInterval=600`、`WorkingDirectory` をリポジトリルートに設定し、`StandardOut/Err` を `ops/logs/*` に出力。
- `ops/SMOKE_CHECK.md` に API_BASE の決め方、手動実行、launchd の load/unload、TOKEN を使った認証チェック、トラブルシューティングを記載。

## S4) ログディレクトリ
- `ops/logs/.gitkeep` を追加し、launchd からのログ出力先を確保。

## S5) 差分/実行方法
- `git diff --name-only` を共有し、`scripts/smoke_check.sh` の使い方と `ops/SMOKE_CHECK.md` の存在を案内する。
