# QA: meeting-translation LP + UTM bridge

**Date**: 2026-02-23
**Build**: `sync_marketing.sh` → 13 pages processed, exit 0

---

## Results (35 checks, 0 FAIL)

### 1. File existence — 5/5 PASS
All 5 pages generated in `marketing_public/`:
`meeting-translation.html`, `meeting-translation/ja-en.html`, `meeting-translation/ja-zh.html`,
`en/meeting-translation.html`, `zh-hans/meeting-translation.html`

### 2. hreflang — 5/5 PASS
| Page | hreflang tags | Expected |
|---|---|---|
| meeting-translation.html (JA hub) | 4 | 4 (ja, en, zh-Hans, x-default) |
| en/meeting-translation.html (EN hub) | 4 | 4 |
| zh-hans/meeting-translation.html (ZH hub) | 4 | 4 |
| meeting-translation/ja-en.html (child) | 0 | 0 |
| meeting-translation/ja-zh.html (child) | 0 | 0 |

### 3. canonical — 5/5 PASS
| Page | canonical |
|---|---|
| meeting-translation.html | `https://lingoflow-ai.com/meeting-translation` |
| meeting-translation/ja-en.html | `https://lingoflow-ai.com/meeting-translation/ja-en` |
| meeting-translation/ja-zh.html | `https://lingoflow-ai.com/meeting-translation/ja-zh` |
| en/meeting-translation.html | `https://lingoflow-ai.com/en/meeting-translation` |
| zh-hans/meeting-translation.html | `https://lingoflow-ai.com/zh-hans/meeting-translation` |

### 4. UTM parameters — PASS
| Page | utm_content | utm_term |
|---|---|---|
| JA hub (Hero/Bottom CTA) | (none) | ja-hub |
| ja-en (Hero/Bottom CTA) | ja-en | ja-en-page |
| ja-zh (Hero/Bottom CTA) | ja-zh | ja-zh-page |
| EN hub (Hero/Bottom CTA) | ja-en | en-hub |
| ZH hub (Hero/Bottom CTA) | ja-zh | zh-hans-hub |

All CTAs have `utm_source=lp` and `utm_campaign=meeting-translation`.

### 5. sitemap — PASS
- 5 meeting-translation URLs present
- `/products/meeting-translation` absent (0 occurrences)

### 6. PWA bridge (`static/app.js`) — PASS
- UTM detection: `utm_source === 'lp'` + `utm_content` → `sessionStorage.setItem('lp_lang_pair', ...)`
- `first_translation` GA4 event: fires once via `sessionStorage.removeItem` guard
- `typeof gtag === 'function'` check: prevents ReferenceError when gtag not loaded
- All wrapped in try/catch

### 7. Misc — PASS
- Unexpanded `<!-- INCLUDE: -->` in marketing_public/: 0
- All 5 pages have 8 `data-section` attributes
- `analytics.js`: `cta_click` handler intact, `tryStart(slug, langPair)` extended, `shareClick` added
