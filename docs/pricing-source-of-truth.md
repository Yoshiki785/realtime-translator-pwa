# Pricing Source of Truth

## Purpose

料金・プラン表記の数値を `static/config/pricing.json` に集約し、以下の静的ページのズレを防止します。

- `static/pricing.html`
- `static/terms.html`
- `static/privacy.html`
- `static/index.html`（チケット購入モーダル）

## Rule

- `public/` は直接編集しない
- 数値変更時は `static/config/pricing.json` のみ編集する
- HTMLの `AUTO:` コメント区間は手編集しない

## Generate

```bash
node ./scripts/generate_pricing.js
```

### Check-only

```bash
node ./scripts/generate_pricing.js --check
```

`--check` は差分があると終了コード `1` を返します。

## Deploy Flow Integration

- `scripts/sync_public.sh` で generate を先に実行
- `scripts/check_public_sync.sh` で `--check` を実行

これにより predeploy 時点で生成漏れを検出できます。

## Note

チケット価格表示は参考値です。実際の課金価格は購入時点でアプリ内表示（Stripe連携）を優先します。
