# Branch Protection 設定手順

main ブランチへの不正なマージを防ぎ、CI チェックを必須にするための GitHub 設定手順です。

## 目的

- Realtime negotiate の仕様逸脱（400 エラーの原因）を CI で検知
- 検証が通らないコードが main にマージされることを防止
- Glossary / Takeover 機能の削除を検知

## 前提条件

**重要**: Branch protection でステータスチェックを選択するには、**先に workflow が 1 回以上実行されている必要があります**。

1. このリポジトリに `.github/workflows/verify.yml` が存在すること
2. 一度 push または PR を作成して workflow を実行すること

## 設定手順

### 1. リポジトリ Settings を開く

1. GitHub でリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニューの **Branches** をクリック

### 2. Branch protection rule を追加

1. **Add branch protection rule** をクリック
2. **Branch name pattern** に `main` と入力

### 3. 必須チェックを設定

以下のオプションを有効化:

- [x] **Require a pull request before merging**
  - 直接 push を禁止し、PR 経由のマージを強制

- [x] **Require status checks to pass before merging**
  - CI が通らないとマージ不可
  - **Require branches to be up to date before merging** を有効化
  - **Status checks that are required** で以下を検索して追加:
    - `Verify Realtime Negotiate Spec`

- [x] **Do not allow bypassing the above settings** (推奨)
  - 管理者も例外なくルールを適用

### 4. 保存

**Create** または **Save changes** をクリック

## ステータスチェックが表示されない場合

「Verify Realtime Negotiate Spec」が検索しても出てこない場合:

1. 一度 PR を作成するか、main に push する
2. Actions タブで workflow が実行されたことを確認
3. 再度 Branch protection 設定画面で検索

## ローカルでの事前検証

PR を出す前にローカルで検証:

```bash
./scripts/verify_realtime_negotiate.sh
```

## CI が検知する項目

| チェック項目 | 内容 |
|-------------|------|
| REALTIME_CALLS_URL | `/v1/realtime/calls` が定義されている |
| negotiate fetch | `fetch(REALTIME_CALLS_URL, ...)` を使用 |
| Content-Type | `application/sdp` を指定 |
| body | `offerSdp` (raw SDP) を送信 |
| 禁止パターン | FormData, JSON, `/v1/realtime?model=` が無い |
| Glossary | `parseGlossary`, `buildSessionInstructions` が存在 |
| Takeover | `showTakeoverDialog`, `force_takeover` が存在 |
| ファイル同期 | `static/app.js` と `public/app.js` が一致 |

## トラブルシューティング

### CI が失敗する

1. `./scripts/verify_realtime_negotiate.sh` をローカルで実行
2. FAIL している項目を確認
3. `static/app.js` の negotiate 関数を修正
4. `cp static/app.js public/app.js` で同期
5. 再度検証スクリプトを実行

### ファイル同期警告

```bash
# static/app.js の変更を public/app.js に反映
cp static/app.js public/app.js
```
