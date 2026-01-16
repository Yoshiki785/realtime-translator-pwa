# Minutes UI Implementation Runbook

## Overview
Stripe導入前に、UIで「現在使える残り分数」を表示する機能を実装。

## Changes Summary

### Backend (app.py)
- Added `next_month_start_utc()` helper function (line 351)
- Updated `/api/v1/me` to return:
  - `nextResetAt`: ISO8601 timestamp of next month start (JST midnight in UTC)
  - `blockedReason`: `"monthly_quota_exhausted"` | `"daily_limit_reached"` | null

### Frontend
- `static/app.js`:
  - Added `nextResetAt`, `blockedReason` to quota state
  - Added `updateQuotaBreakdown()` for settings modal
  - Added `blockedReasonMessages` for user-friendly error text
- `static/index.html`:
  - Added quota breakdown section in settings modal
- `static/styles.css`:
  - Added styles for `.quota-breakdown-section`, `.breakdown-row`
- `public/*`: Synced from `static/`

## API Response Shape

```json
{
  "plan": "free",
  "baseMonthlyQuotaSeconds": 1800,
  "usedBaseSecondsThisMonth": 600,
  "baseRemainingThisMonth": 1200,
  "ticketSecondsBalance": 0,
  "totalAvailableThisMonth": 1200,
  "maxSessionSeconds": 600,
  "activeJob": false,
  "monthKey": "2026-01",
  "dayKey": "2026-01-12",
  "nextResetAt": "2026-01-31T15:00:00+00:00",
  "blockedReason": null,
  "baseDailyQuotaSeconds": 600,
  "usedSecondsToday": 0,
  "dailyRemainingSeconds": 600
}
```

## Verification Steps

### 1. Production API Health Check
```bash
curl -s "https://realtime-translator-api-853238768850.asia-northeast1.run.app/health" | jq
```

### 2. Local Development Test
```bash
# Start local server
python app.py

# Test with auth bypass (dev only)
DEBUG_AUTH_BYPASS=1 curl -s "http://localhost:8080/api/v1/me" \
  -H "Authorization: Bearer test" | jq
```

### 3. UI Verification (after deploy)
1. **ヘッダー表示**: ログイン後、ヘッダーに「残り: XX分」が表示されること
2. **設定モーダル**:
   - ⚙️ボタンをクリック
   - 「利用状況」セクションに内訳が表示されること:
     - プラン: Free/Pro
     - 月間残り: XX分
     - チケット残高: XX分
     - 合計: XX分
     - 次回リセット: M/D H:MM
3. **ブロック表示**:
   - quota使い切った状態でStartボタン押下
   - エラーメッセージが表示されること

## Rollback

```bash
# If issues found after deploy:

# 1. Identify current commit
git log --oneline -3

# 2. Revert to previous state
git checkout HEAD~1 -- app.py static/app.js static/index.html static/styles.css
git checkout HEAD~1 -- public/app.js public/index.html public/styles.css

# 3. Redeploy
gcloud run deploy realtime-translator-api --source . --region asia-northeast1

# 4. Verify rollback
curl -s "https://realtime-translator-api-853238768850.asia-northeast1.run.app/health"
```

## Files Modified
- `app.py`
- `static/app.js`
- `static/index.html`
- `static/styles.css`
- `public/app.js`
- `public/index.html`
- `public/styles.css`

## State Tracking
Progress tracked in `MINUTES_UI_STATE.json`
