# Analytics Event Schema — Quick Reference

> 運用ドキュメント・KPI 設計は `docs/analytics.md` を参照。
> このファイルはイベントスキーマの速参照用。

---

## GA4 プロパティ

| プロパティ | Measurement ID | 対象 |
|---|---|---|
| LP (Marketing) | `G-39NFY1FDW9` | lingoflow-ai.com |
| App (PWA) | `G-NSMYHFHFKB` | app.lingoflow-ai.com |

---

## 命名規則

- `event_name`: snake_case 固定
- パラメータ名: snake_case
- ラベル/ID: 表示文言ではなく固定IDを使用 (`hero-try-free` not `Try Free`)
- 数値: bucket 化必須 (生の秒数・回数は送らない)
- PII 禁止: uid, email, transcript, token 等は一切含めない

---

## LP イベント (`G-39NFY1FDW9`)

### `page_view`
| Param | Type | Example |
|---|---|---|
| (自動) | — | GA4 標準 page_view |

### `cta_click`
| Param | Type | Example | 備考 |
|---|---|---|---|
| `cta_id` | string | `'hero-try-free'` | data-analytics-label (固定ID) |
| `link_url` | string | `'https://app.lingoflow-ai.com'` | href 絶対URL |
| `page_path` | string | `'/'` | pushEvent 内で自動付与 |

### `section_view`
| Param | Type | Example |
|---|---|---|
| `event_label` | string | `'hero'`, `'features'` |

### `demo_view`
| Param | Type | Example |
|---|---|---|
| `event_label` | string | `'demo-section'` |

### `try_start` (LP API)
| Param | Type | Example |
|---|---|---|
| `event_label` | string | `'realtime-translator'` |

---

## App イベント (`G-NSMYHFHFKB`)

> App イベントは `analytics._context()` で `plan`, `ui_lang`, `build_version` が自動付与される。

### `login`
| Param | Enum | 備考 |
|---|---|---|
| `method` | `'google'` | Firebase Auth state change 時 |

### `logout`
| Param | 備考 |
|---|---|
| (なし) | context のみ |

### `try_start`
| Param | Enum | 備考 |
|---|---|---|
| `entry` | `'lp'` / `'direct'` | referrer で判定 |

### `session_start`
| Param | Type | 備考 |
|---|---|---|
| `input_lang` | string | 言語コード or `'auto'` |
| `output_lang` | string | 言語コード or `'ja'` |

### `session_end`
| Param | Enum |
|---|---|
| `duration_bucket` | `'<30s'` / `'30s-2m'` / `'2m-5m'` / `'5m-15m'` / `'15m+'` / `'unknown'` |
| `utterance_count_bucket` | `'unknown'` (未実装) |
| `result` | `'success'` / `'error'` / `'cancel'` |

### `session_error`
| Param | Enum |
|---|---|
| `error_class` | `'quota'` / `'token'` / `'auth'` / `'connection'` / `'unknown'` |
| `phase` | `'start'` / `'end'` |

### `quota_blocked`
| Param | Enum |
|---|---|
| `reason` | `'monthly'` / `'daily'` / `'daily_job_limit'` / `'other'` |

### `upgrade_initiated`
| Param | Enum |
|---|---|
| `source` | `'settings'` |

### `ticket_purchased`
| Param | Enum |
|---|---|
| `pack_id` | `'t120'` / `'t240'` / `'t360'` / `'t1200'` / `'t1800'` / `'t3000'` / `'unknown'` |
| `quantity_bucket` | `'<=120m'` / `'121-360m'` / `'361-1200m'` / `'1200m+'` / `'unknown'` |

### `purchase_success`
| Param | Enum | 備考 |
|---|---|---|
| `plan` | `'pro'` / `'ticket'` | 購入種別 |
| `pack_id` | `'pro_monthly'` / `'t120'`..`'t3000'` / `'unknown'` | 安定識別子 |
| `currency` | `'JPY'` | 通貨コード |

### `settings_changed`
| Param | Enum |
|---|---|
| `setting_key` | `'uiLang'` / `'inputLang'` / `'outputLang'` / `'glossary_text'` / `'summary_prompt'` / `'maxChars'` / `'gapMs'` / `'vadSilence'` |

### `legal_link_clicked`
| Param | Enum |
|---|---|
| `link_type` | `'pricing'` / `'privacy'` / `'terms'` |
| `source` | `'footer'` / `'settings'` / `'unknown'` |

### `contact_link_clicked`
| Param | Enum |
|---|---|
| `channel` | `'email'` / `'form'` |
| `source` | `'footer'` / `'settings'` / `'help'` / `'unknown'` |

### `help_open`
| Param | Enum |
|---|---|
| `source` | `'header'` |

### `feedback_open`
| Param | Enum |
|---|---|
| `source` | `'help_dialog'` |

### `feedback_submit`
| Param | Enum |
|---|---|
| `length_bucket` | `'<50'` / `'50-200'` / `'200+'` |

---

## Core Funnel

```
cta_click (LP, G-39NFY1FDW9)
  → try_start (App, G-NSMYHFHFKB)
    → login
      → session_start
        → session_end (result='success')
```

## Revenue Funnel

```
upgrade_initiated → purchase_success (plan='pro')
quota_blocked → ticket_purchased / purchase_success (plan='ticket')
```
