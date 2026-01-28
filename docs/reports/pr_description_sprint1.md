# Sprint1: Realtime diagnostics + TDZ guardrails

## What
- Realtime diagnosticsを強化し、`session.update` をCalls APIフォーマットへ更新。
- TDZ回避の初期化分離（critical/non-critical）と関数宣言化を実施。
- TDZ/DOM初期化のガードレール（スクリプト + ドキュメント）を追加。

## Why
- Realtimeのセッション情報が不足しており、障害切り分けが難しい。
- TDZエラーが`DOMContentLoaded`を停止させ、ログインが無効化される事例があった。

## How
- `static/app.js`でinit分割、TDZ安全化、Realtimeログ文脈付与。
- `session.update` payloadをRealtime Calls API仕様へ整合。
- `verify_no_tdz.sh` / `smoke_dom_init.sh` を追加し`check_public_sync.sh`に統合。
- `public/app.js`はstatic→public同期方針を維持。

## Test
- `sync_public/check_public_sync/node --check`

## Notes
- Open: なし。
- Risk: Calls API向け`session.update`仕様の互換性はステージングで継続確認推奨。

## Scope
- In: `static/app.js`, `public/app.js`, `scripts/verify_no_tdz.sh`, `scripts/smoke_dom_init.sh`, `scripts/check_public_sync.sh`, `docs/dev-guardrails.md`
- Out: 辞書UI関連（`public/index.html`, `public/styles.css`, `public/sw.js`, `tests/conftest.py`, `tests/test_dictionary_crud.py`）
