# UI_LAYOUT_RUNBOOK.md

## 仕様（DOM構成と役割）
| DOM ID | 位置 | 役割 |
|--------|------|------|
| #liveTranscript | 上段 | 原文ライブ表示（逐次/部分テキスト） |
| #transcriptLog | 下段左 | 原文確定ログ（新しいほど上） |
| #translationLog | 下段右 | 翻訳完了ログ（新しいほど上） |

## 現象
- マイク認識とリアルタイム翻訳は動作している
- ただし表示が前回の3エリア構成と異なる

## 要望
1. 文字出力を3エリアに戻す（上:ライブ、下左:原文ログ、下右:翻訳ログ）
2. ログは新しいものが上に追加される
3. ログエリアは縦スクロール可能
4. 青い画面基調を維持

## 重要制約（AI_WORKFLOW.mdより）
- `static/`のみ編集、`public/`直接編集禁止
- 同期: `rm -rf public/* && cp -R static/* public/`
- 必須ファイル: index.html, app.js, styles.css, manifest.json, sw.js

---

## L0) 初期化
- [x] AI_WORKFLOW.md読了
- [x] UI_LAYOUT_STATE.json作成
- [x] UI_LAYOUT_RUNBOOK.md作成

## L1) 現状UI構造とJS参照の把握
**変更前DOM:**
- `#subtitleOriginal` - 原文ライブ
- `#subtitleTranslation` - 翻訳ライブ

**変更前JS:**
- `updateLiveText()` - ライブ表示更新
- `commitLog()` - state.logs配列に追加（DOMには非表示）
- `translateCompleted()` - state.translations配列に追加（DOMには非表示）

## L2) UIレイアウトを「上1つ + 下2つ」に戻す
**変更後HTML:**
```html
<div class="live-area">
  <div class="live-label">Live</div>
  <div class="live-text" id="liveTranscript">・・・</div>
</div>
<div class="log-container">
  <div class="log-panel">
    <div class="log-label">原文ログ</div>
    <div class="log-scroll" id="transcriptLog"></div>
  </div>
  <div class="log-panel">
    <div class="log-label">翻訳ログ</div>
    <div class="log-scroll" id="translationLog"></div>
  </div>
</div>
```

**変更後CSS:**
- `.content` - flexbox縦方向
- `.live-area` - 上段ライブエリア
- `.log-container` - 下段2カラムgrid
- `.log-scroll` - max-height:35vh + overflow-y:auto

## L3) ログの積み上げ方向を実装
- `addLogEntry()` - container.prepend()で新しいエントリを上に追加
- 上限500行、超過時は末尾削除

## L4) JSの既存機能に接続
- `cacheElements()` - 新ID（liveTranscript, transcriptLog, translationLog）に更新
- `updateLiveText()` - #liveTranscript.textContentを更新
- `commitLog()` - addTranscriptLog()を呼び出し
- `translateCompleted()` - addTranslationLog()を呼び出し
- `start()` - clearLogs()を追加

## L5) 最小の動作確認
- [x] ログインできる
- [x] 設定ボタンが動く
- [x] Startボタンでマイク許可が出る
- [x] 原文ライブが表示される
- [x] 原文確定時にログに追加される
- [x] 翻訳完了時にログに追加される
- [x] コンソールエラーなし

## L6) static→public同期
- 実行日時: 2026-01-11
- 結果: 成功
- 必須ファイル: index.html, app.js, styles.css, manifest.json, sw.js ✓

## L7) デプロイ手順
```bash
firebase deploy --only hosting
```

### SWキャッシュクリア手順
1. Chrome DevTools > Application > Service Workers > Unregister
2. Storage > Clear site data
3. Hard Reload（Cmd+Shift+R）
4. シークレットウィンドウでも確認
