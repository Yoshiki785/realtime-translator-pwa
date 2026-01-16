# TICKET_HOOK_RUNBOOK

## 目的
Firebase 認証済ユーザーに対して、プラン別クォータ（Free/Pro）と有料チケット秒数を組み合わせたジョブ利用上限を実装し、後日チケット残高を加算するだけで時間販売ができるようにする。

## ポリシー（BASE + TICKET）
- タイムゾーン: Asia/Tokyo
- 日付キー: `dayKey = YYYY-MM-DD`, 月キー: `monthKey = YYYY-MM`
- **Free プラン**
  - `baseMonthlyQuotaSeconds = 1800` (30分)
  - `baseDailyQuotaSeconds = 600` (10分) ※チケット消費分も含む
  - `maxSessionSeconds = 600`
  - `maxConcurrentJobs = 1`
  - `createRateLimitPerMin = 6`
- **Pro プラン**
  - `baseMonthlyQuotaSeconds = 7200` (120分)
  - `baseDailyQuotaSeconds = null`（日毎制限なし）
  - `maxSessionSeconds = 7200`
  - `maxConcurrentJobs = 1`
  - `createRateLimitPerMin = 12`
- **チケット**
  - `users/{uid}.ticketSecondsBalance`（デフォルト0）
  - `totalAvailableThisMonth = baseRemainingThisMonth + ticketSecondsBalance`
  - 消費順序: base → ticket
  - Free の日次上限は base+ticket 合計に対して適用

## タスク一覧
1. **H0**: state/runbook 初期化
2. **H1**: 既存のジョブ作成/完了エンドポイントと Firestore 参照箇所を確認
3. **H2**: dayKey/monthKey ユーティリティ（TZ=Asia/Tokyo）とユーザー初期化ロジック
4. **H3**: `/api/v1/jobs/create` でのクォータ判定＋予約ロジック
5. **H4**: `/api/v1/jobs/complete` の課金/チケット差分処理
6. **H5**: `/api/v1/me` 追加
7. **H6**: フロントエンドで残量表示と Start ブロック
8. **H7**: 手動/自動検証ステップを runbook へ
9. **H8**: static→public 同期、デプロイコマンド提示（実行しない）

---

## H0) 初期化
- [x] AI_WORKFLOW.md 確認済
- [x] `TICKET_HOOK_STATE.json` 生成
- [x] `TICKET_HOOK_RUNBOOK.md` 作成（本ファイル）

## H1) 既存実装の調査
- `/api/v1/jobs/create` (app.py L676-) : `ensure_user_profile` + `usage_monthly` を読み、単純な月次 quota 秒数(PLANS)だけ判定し `jobs` コレクションへ `status=created` を保存。日次制限やチケットは未実装。
- `/api/v1/jobs/complete` + `complete_job_transaction*` (app.py L729-, L458-/506-) : `usage_monthly.usedSeconds` をインクリメントし `job.status` を `succeeded` に変えるのみ。ジョブ詳細や予約情報なし。
- `ensure_user_profile` (app.py L338-) : `users/{uid}` ドキュメントに `plan/quotaSeconds/retentionDays` などを補正しつつ保持。日次やチケット関連フィールドは無し。
- `usage_monthly` コレクション : ドキュメント ID は `uid_YYYY-MM`。`usedSeconds` だけを記録。今回の ticket hook 用には大幅なスキーマ拡張が必要。

## H2) 日次/月次ヘルパー & ユーザー初期化
- `app.py`
  - `day_key`, `safe_int`, `normalize_plan`, `read_user_state`, `normalize_user_usage_data`, `apply_user_updates` を追加。
  - Asia/Tokyo 基準で dayKey/monthKey をリセットし、`usedSecondsToday`, `usedBaseSecondsThisMonth`, `ticketSecondsBalance`, `activeJobId` を初期化。
  - `ensure_user_profile` も PLANS の新属性（baseMonthlyQuotaSeconds 等）を参照するよう更新。

## H3) `/api/v1/jobs/create`
- トランザクション化された `_create_job_core` を実装。Free/Pro ごとの `baseDailyQuotaSeconds`, `baseMonthlyQuotaSeconds`, `maxSessionSeconds` を参照。
- `ticketSecondsBalance` を取り込んだ `totalAvailableThisMonth`、Free の日次 600 秒 cap を判定。
- `activeJobId` が存在して 120 秒 grace 内なら 409 を返却。stale の場合は上書き。
- `jobCreateMinuteKey` + `jobCreateCount` で1分あたりの作成回数を計測し、Free=6, Pro=12 を超えると 429 (rate_limited)。
- 予約秒数を base/ticket に分割 (`reservedBaseSeconds`, `reservedTicketSeconds`) して `jobs/{jobId}` に `status=running` で保存。
- レスポンスには `reservedSeconds`, `baseRemainingThisMonth`, `ticketSecondsBalance`, `dailyRemainingSeconds` 等を含め、422/429/409 で明示的エラー文言を返却。

## H4) `/api/v1/jobs/complete`
- `_complete_job_core` を新設し、`startedAt`→`now` から算出した `actualSeconds` と予約秒数の min を `billedSeconds` に採用。
- base を優先消費し、残りを `ticketSecondsBalance` から差し引き（0未満は切り上げ＆警告ログ）。
- Free の `usedSecondsToday`、共通の `usedBaseSecondsThisMonth` を更新し、`activeJobId/StartedAt` を解除。
- ジョブにも `billedBaseSeconds`, `billedTicketSeconds`, `planAtCompletion`, `endedAt` を記録し、構造化ログに `billed*` を含める。

## H5) `/api/v1/me`
- 新規エンドポイント。`read_user_state` + `build_quota_snapshot` で以下を返却:
  - `plan`, `baseMonthlyQuotaSeconds`, `usedBaseSecondsThisMonth`, `baseRemainingThisMonth`
  - `ticketSecondsBalance`, `totalAvailableThisMonth`, `maxSessionSeconds`, `activeJob`
  - Free のみ `baseDailyQuotaSeconds`, `usedSecondsToday`, `dailyRemainingSeconds`

## H6) フロントエンド
- `static/index.html`：トップバーに `#quotaInfo` を追加し、`styles.css` で青系メトリクスを表示。
- `static/app.js`：
  - `/api/v1/me` 取得→`applyQuotaFromPayload` で Free の「本日10分」「今月 + チケット」の残量を表示。
  - Start 押下前に `refreshQuotaStatus` + `hasQuotaForStart` でクォータ不足時にブロック。
  - `/api/v1/jobs/create` でジョブを予約し、Stop/エラー時は `/api/v1/jobs/complete` で確実に精算（diag log に billed 秒数）。
  - Dev Panel のサマリにも残量を組み込み、`quotaInfo`/`updateDevStatusSummary` を同期。

## H7) 検証
- **API** (DEBUG_AUTH_BYPASS=1):
  1. `POST /api/v1/jobs/create` で Free プランが 600秒/day, 1800秒/月で拒否されること・レスポンスに `ticketSecondsBalance` 等が含まれることを確認。
  2. `POST /api/v1/jobs/complete` に `audioSeconds` を渡し、`users/{uid}` の `usedBaseSecondsThisMonth`, `ticketSecondsBalance` が更新されることを Firestore Emulator/Mock で確認。
  3. `GET /api/v1/me` のレスポンスに plan/dailyRemaining/totalAvailable が含まれ、ログに `Account snapshot` が出力されることを確認。
- **Frontend**:
  - ログイン後にトップバーへ残量が表示されること。
  - Free プランで `?debug=1` を使って UI から Start を繰り返し、3回以上/分で 429 (rate_limited) が表示され Start がブロックされること。
  - Stop 時に `/api/v1/jobs/complete` が呼ばれ、Dev Panel の `Quota` 表示が更新されること。
- 受入れチェックリスト：
  - [x] Free: チケットを持っていても 1日10分超過不可（`dailyRemainingSeconds` 判定 + completion 時の totalUsage で enforce）。
  - [x] Free: 月次割当+チケットの合計を超えるジョブは拒否される（`totalAvailableThisMonth <= 0` で 402）。
  - [x] Pro: 月次/チケット残があれば1セッション120分まで実行可能（`maxSessionSeconds`=7200, daily cap 無し）。
  - [x] `ticketSecondsBalance` がデフォルト0で存在し、Base→Ticket の順に減算される。

## H8) 同期 & デプロイコマンド
- 実行済: `rm -rf public/*` → `cp -R static/* public/`
- `public/` に `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js` が存在することを確認
- デプロイコマンド（実行せず）:
  - `firebase deploy --only hosting`
  - `gcloud run deploy <service> ...` ※ DEPLOY.md 参照
