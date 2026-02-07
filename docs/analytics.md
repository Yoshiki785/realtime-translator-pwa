# Analytics Event Catalog — Realtime Translator

## Overview

| Item | Value |
|------|-------|
| SDK | Firebase Analytics compat 10.7.1 (GA4 backend) |
| measurementId | `G-NSMYHFHFKB`（GA4 Web データストリームで検証済み 2026-02） |
| Helper | `analytics` object in `static/app.js` |
| Policy | **best-effort / silent-fail / no-PII** |
| Debug | URL に `?debug_mode=true` を付与 → GA4 DebugView 対応 |

---

## Principles

### 送らない情報（厳守）

以下の値は **いかなるイベント・パラメータにも含めない**:

| 禁止項目 | 理由 |
|----------|------|
| uid / email / displayName | 個人識別情報 |
| userAgent | フィンガープリント素材 |
| transcript / translation | ユーザーコンテンツ |
| audioUrl | ユーザーコンテンツ |
| sessionId / jobId | サーバー内部 ID |
| token / apiKey | 認証情報 |

### 送る値のルール

- **enum / coarse bucket のみ** — 連続数値は bucket 化して送信
- **失敗しても黙殺** — `analytics.log()` 内部は try/catch、`_enabled=false` 時は即 return
- **debug_mode 限定のログ** — `?debug_mode=true` 時のみ console 出力と `debug_mode: true` パラメータ付与

---

## Context Parameters（全イベント自動付与）

| Param | Source | Example | 備考 |
|-------|--------|---------|------|
| `plan` | `state.quota.plan` | `'free'`, `'pro'`, `'unknown'` | ユーザーのプラン |
| `ui_lang` | `state.uiLang` | `'ja'`, `'en'`, `'unknown'` | UI 表示言語 |
| `build_version` | `buildSha[0:7]` | `'e283b40'` | デプロイバージョン |
| `debug_mode` | URL param | `true` | `?debug_mode=true` 時のみ |

---

## Event Catalog

### 1. `login`

| Item | Value |
|------|-------|
| Trigger | Firebase Auth state change（Google サインイン成功時） |
| Location | `static/app.js` L5161 |
| Params | `method: 'google'` |
| 備考 | ページリロードでセッション復元時にも発火する |

### 2. `logout`

| Item | Value |
|------|-------|
| Trigger | ログアウトボタンクリック → `signOut()` 成功後 |
| Location | `static/app.js` L5144 |
| Params | (なし、context のみ) |

### 3. `session_start`

| Item | Value |
|------|-------|
| Trigger | `reserveJobSlot()` 成功後、接続開始前 |
| Location | `static/app.js` L4803 |
| Params | `input_lang`, `output_lang` |
| Enum | input_lang: 言語コード or `'auto'` / output_lang: 言語コード or `'ja'` |

### 4. `session_end`

| Item | Value |
|------|-------|
| Trigger | 翻訳セッション停止・終了時 |
| Location | `static/app.js` L4957 |
| Params | `duration_bucket`, `utterance_count_bucket`, `result` |

| Param | Enum Values |
|-------|-------------|
| `result` | `'success'` \| `'error'` \| `'cancel'` |
| `duration_bucket` | `'<30s'` \| `'30s-2m'` \| `'2m-5m'` \| `'5m-15m'` \| `'15m+'` \| `'unknown'` |
| `utterance_count_bucket` | 常に `'unknown'`（未実装、[Known Issue #2](#issue-2-utterance_count_bucket-が常に-unknown)） |

### 5. `session_error`

| Item | Value |
|------|-------|
| Trigger | セッション開始 or 終了時のエラー |
| Locations | `static/app.js` L4814 (start), L4929 (m4a convert), L4948 (job complete) |
| Params | `error_class`, `phase` |

| Param | Enum Values |
|-------|-------------|
| `error_class` | `'quota'` \| `'token'` \| `'auth'` \| `'connection'` \| `'unknown'` |
| `phase` | `'start'` \| `'end'` |

### 6. `quota_blocked`

| Item | Value |
|------|-------|
| Trigger | クオータ検証失敗 or HTTP 429 レスポンス |
| Locations | `static/app.js` L3943, L3951, L3957, L4012, L4020 |
| Params | `reason` |

| Param | Enum Values | 元の blockedReason |
|-------|-------------|-------------------|
| `reason` | `'monthly'` | `monthly_quota_exhausted` |
| | `'daily'` | `daily_limit_reached` |
| | `'daily_job_limit'` | `daily_job_limit_reached` |
| | `'other'` | その他 / 不明 |

### 7. `upgrade_initiated`

| Item | Value |
|------|-------|
| Trigger | 「Upgrade to Pro」ボタンクリック |
| Location | `static/app.js` L5716 |
| Params | `source: 'settings'` |
| 備考 | 将来、他の source（例: quota_blocked ダイアログ）を追加可能 |

### 8. `ticket_purchased`

| Item | Value |
|------|-------|
| Trigger | Stripe からの戻り（hash = `#/tickets/success`） |
| Location | `static/app.js` L3414 |
| Params | `pack_id`, `quantity_bucket` |

| Param | Enum Values |
|-------|-------------|
| `pack_id` | `'t120'` \| `'t240'` \| `'t360'` \| `'t1200'` \| `'t1800'` \| `'t3000'` \| `'unknown'` |
| `quantity_bucket` | `'<=120m'` \| `'121-360m'` \| `'361-1200m'` \| `'1200m+'` \| `'unknown'` |

> **Note**: pack_id は sessionStorage 経由で Stripe リダイレクトを跨いで保持。
> sessionStorage 不可時は `'unknown'` にフォールバック。

### 9. `settings_changed`

| Item | Value |
|------|-------|
| Trigger | 設定保存時（変更されたキーごとに 1 イベント） |
| Location | `static/app.js` L5418 |
| Params | `setting_key` |
| Enum | `'uiLang'` \| `'inputLang'` \| `'outputLang'` \| `'glossary_text'` \| `'summary_prompt'` \| `'maxChars'` \| `'gapMs'` \| `'vadSilence'` |

---

## Known Issues

### Issue 1: ticket_purchased の pack_id 追跡

Stripe リダイレクト前に `sessionStorage` に packId を保存し、戻り時に取得する方式で対応済み。
sessionStorage が使えない環境（一部 Safari Private Mode 等）では `'unknown'` にフォールバックする。

### Issue 2: utterance_count_bucket が常に 'unknown'

発話カウント機構が未実装。将来、`conversation.item.input_audio_transcription.completed`
イベントのカウントで実装可能だが、現時点ではスコープ外。

### Issue 3: errorCategory の粒度差

| 分類系 | 用途 | 値の数 | Location |
|--------|------|--------|----------|
| `ERROR_CATEGORY` | UI エラーメッセージ表示 | 9 値 | L3744 |
| `analytics.errorCategory()` | Analytics 送信用 | 5 値 | L1130 |

これは意図的な設計。Analytics 側は粗い分類（GA4 カーディナリティ制限を考慮）、
UI 側はユーザー向けに詳細な分類を使用する。

---

## KPI Proposals

### Core Funnel

```
login → session_start → session_end(result='success')
```

- **Login → Session 開始率**: session_start / login（同日）
- **Session 完走率**: session_end(success) / session_start
- **Cancel 率**: session_end(cancel) / session_start

### Quota Impact

- **Quota Blocked 率**: quota_blocked / (session_start + quota_blocked)
- **Reason 分布**: reason 別の quota_blocked 内訳
- **Upgrade 転換率**: upgrade_initiated / quota_blocked（upgrade の動機分析）

### Revenue

- **Pro 転換**: upgrade_initiated → billing_success（hash route）の転換率
- **Ticket 購入**: ticket_purchased の pack_id 分布
- **ARPU 推計**: pack_id ごとの分単価 × 購入回数

### Error Health

- **Error 率**: session_error / session_start
- **Error 分布**: error_class × phase のクロス集計
- **Connection 安定性**: error_class='connection' の推移

### Settings Adoption

- **設定変更率**: settings_changed 発火ユーザー / 全ユーザー
- **人気設定**: setting_key の分布（glossary_text, vadSilence 等の利用状況）

---

## Debug / Verification Procedures

### 1. GA4 DebugView でリアルタイム確認

1. アプリ URL に `?debug_mode=true` を付与してアクセス
2. GA4 コンソール → Configure → DebugView を開く
3. イベントを発火させる（ログイン、セッション開始等）
4. DebugView にイベントがリアルタイム表示される

### 2. Console ログで init 確認

`?debug_mode=true` 付与時、以下のログが出力される:

```
[ANALYTICS_DEBUG] pre-init firebase.apps.length: 0
[ANALYTICS_DEBUG] config.measurementId: G-NSMYHFHFKB
[ANALYTICS_DEBUG] post-init firebase.app().options.measurementId: G-NSMYHFHFKB
[ANALYTICS_DEBUG] post-init firebase.apps.length: 1
[ANALYTICS_DEBUG] config.measurementId: G-NSMYHFHFKB
[ANALYTICS_DEBUG] firebase.app().options.measurementId: G-NSMYHFHFKB
[ANALYTICS_DEBUG] firebase_analytics_present: true
[ANALYTICS_DEBUG] analytics_init_ok: true
```

すべての measurementId が `G-NSMYHFHFKB` と一致し、`analytics_init_ok: true` であれば正常。

### 3. GA4 Realtime レポート

GA4 コンソール → Reports → Realtime で直近 30 分のイベントを確認。
`debug_mode=true` のイベントも表示される。

### 4. EVENT_SCHEMA バリデーション (debug_mode 限定)

`?debug_mode=true` 時、未知のイベント名や予期しないパラメータがあると console.warn が出力される:

```
[ANALYTICS_DEBUG] Unknown event: "typo_event"
[ANALYTICS_DEBUG] Unexpected params for "login": ["bad_param"]
```

### 5. Localhost Suppression

`localhost` / `127.0.0.1` / `[::1]` では analytics は自動的に無効化される。
`?debug_mode=true` を付与することでローカルでも analytics を有効化してテスト可能。

| 環境 | debug_mode | analytics |
|------|-----------|-----------|
| Production | なし | 有効 |
| Production | `?debug_mode=true` | 有効 + DebugView |
| localhost | なし | **無効** |
| localhost | `?debug_mode=true` | 有効 + DebugView |

### 6. Manual Event Testing (`window.__rt_analytics`)

`?debug_mode=true` 時、`window.__rt_analytics.logEvent(name, params)` が利用可能。
Console から直接イベントを発火してテストできる:

```js
window.__rt_analytics.logEvent('login', { method: 'google' });
// → [ANALYTICS_DEBUG] logEvent: login {method: "google"}
```

### 7. measurementId ピン留め (Runtime Override Prevention)

Firebase SDK は内部的に `firebase.googleapis.com` の webConfig を fetch し、
そこに含まれる measurementId で `gtag('config', ...)` を呼び出す。
本アプリでは `static/firebase-config.js` の measurementId を正とするため、
`analytics.init()` 内で gtag ラッパーを設置し、runtime の measurementId を
static 値にピン留めしている。

`?debug_mode=true` 時、ピン留めが発動すると以下のログが出力される:
```
[ANALYTICS_DEBUG] gtag config mid pinned: G-C0S8XED8NB → G-NSMYHFHFKB
```

---

## No-PII Checklist（新イベント追加時）

新しい analytics イベントを追加する際、以下をすべて確認する:

- [ ] event_name が `EVENT_SCHEMA` に追加されているか
- [ ] params に uid / email / displayName が含まれていないか
- [ ] params に userAgent / IP アドレスが含まれていないか
- [ ] params に transcript / translation / audioUrl が含まれていないか
- [ ] params に sessionId / jobId が含まれていないか
- [ ] params に token / apiKey が含まれていないか
- [ ] 数値パラメータは bucket 化されているか（生の秒数・回数を送らない）
- [ ] 文字列パラメータは enum（固定値）か
- [ ] `docs/analytics.md` の Event Catalog に追記したか
- [ ] `?debug_mode=true` で DebugView に正しく表示されるか
