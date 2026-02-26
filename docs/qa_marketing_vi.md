# QA: Vietnamese (vi) Language Addition

## Build & Check
- `sync_marketing.sh`: PASS — 28 pages processed
- `check_marketing_sync.sh`: PASS — all files in sync

## Hreflang Verification
- `grep -c '<link.*hreflang="vi"' marketing_public/index.html` → **1**
- `grep -c '<link.*hreflang' marketing_public/index.html` → **5** (en, ja, zh-Hans, vi, x-default)
- `grep -rl '<link.*hreflang="vi"' marketing_public/ | wc -l` → **20** (5 groups × 4 pages)

## Sitemap
- `grep -c 'lingoflow-ai.com/vi' marketing_public/sitemap.xml` → **5**

## Switcher
- `grep -c 'Tiếng Việt' marketing_public/index.html` → **2** (desktop + mobile)
- `grep -c "'vi'" marketing_public/js/observer.js` → **3** (LANG_LABELS, LANG_CANONICAL, fallback)

## File Counts
- Modified: 20
- New: 5 (vi.html, vi/products.html, vi/pricing.html, vi/contact.html, vi/meeting-translation.html)
