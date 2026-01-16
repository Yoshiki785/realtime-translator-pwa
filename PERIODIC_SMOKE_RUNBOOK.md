# PERIODIC_SMOKE_RUNBOOK

## ゴール
Cloud Run ベースURL (`https://realtime-translator-api-853238768850.asia-northeast1.run.app`) に対して `scripts/smoke_check.sh` のヘルスチェックを 10 分間隔で launchd から実行する。TOKEN は使わず、ログは `ops/logs/smokecheck.{out,err}` に記録する。

---

## アーキテクチャ

```
launchd (10分間隔)
    │
    ▼
scripts/smoke_wrapper.sh
    ├── ログローテーション (日次、14日保持)
    ├── scripts/smoke_check.sh 実行
    ├── 状態管理 (OK/FAIL)
    └── macOS 通知 (FAIL時、RECOVERY時)
```

### ファイル構成
| ファイル | 役割 |
|----------|------|
| `ops/launchd/com.yoshiki.rttranslator.smokecheck.plist` | LaunchAgent 定義 |
| `scripts/smoke_wrapper.sh` | ラッパー（ローテーション・通知） |
| `scripts/smoke_check.sh` | 実際のヘルスチェック |
| `ops/logs/smokecheck.out` | 標準出力ログ |
| `ops/logs/smokecheck.err` | 標準エラーログ |
| `ops/logs/smokecheck.state` | 最新状態 (OK/FAIL) |
| `ops/logs/smokecheck.rotated_date` | ローテーション日付マーカー |

---

## macOS 通知機能

### 通知タイミング
- **FAIL 時**: `Smokecheck FAILED. Check ops/logs/smokecheck.err`
- **RECOVERY 時**: 前回 FAIL → 今回 PASS で `Smokecheck recovered (PASS)`

### macOS 権限設定
通知を受け取るには、macOS の通知権限が必要です。

1. **システム設定 → 通知** を開く
2. **スクリプトエディタ** または **osascript** を探す
3. **通知を許可** をオンにする

初回実行時に権限ダイアログが表示される場合があります。

### 手動テスト
```bash
osascript -e 'display notification "Test notification" with title "RTTranslator Smokecheck"'
```

---

## ログローテーション

### 動作
- **タイミング**: 日次（日付が変わった最初の実行時）
- **保持期間**: 14日
- **マーカーファイル**: `ops/logs/smokecheck.rotated_date`

### ローテーション後のファイル
```
ops/logs/
├── smokecheck.out              # 当日のログ
├── smokecheck.err              # 当日のログ
├── smokecheck.out.2025-01-11   # アーカイブ
├── smokecheck.err.2025-01-11   # アーカイブ
├── smokecheck.state            # 最新状態
└── smokecheck.rotated_date     # ローテーション日付
```

### 手動クリーンアップ
```bash
find ops/logs -type f \( -name 'smokecheck.out.????-??-??' -o -name 'smokecheck.err.????-??-??' \) -mtime +14 -delete
```

---

## なぜ bash + 絶対パス + WorkingDirectory で getcwd/shell-init 問題を防げるか

### 問題の背景
- launchd から起動されるプロセスは、デフォルトで `/` や `/var/root` を cwd として起動する。
- `Documents` や iCloud Drive 配下を参照すると、TCC (Transparency, Consent, and Control) の制限により `getcwd: Operation not permitted` が発生することがある。
- 相対パス (`./scripts/...`) を使用すると、cwd が不明・アクセス不可の状態で失敗する。
- zsh は起動時に `.zshrc` / `.zprofile` を読み込み、shell-init ノイズ（警告やエラー）を出力することがある。

### 解決策
1. **bash を使用**: `/bin/bash -lc` で起動することで、zsh の複雑な初期化処理を回避し、shell-init ノイズを減らす。
2. **WorkingDirectory を明示的に設定**: launchd plist で `<key>WorkingDirectory</key>` を使い、リポジトリの絶対パスを指定する。
3. **ProgramArguments 内も絶対パスで記述**: スクリプト実行も全て絶対パスで行い、cwd に一切依存しない構成にする。
4. **TCC の制約を回避**: `~/src` 配下であれば通常 TCC の制限を受けないため、リポジトリを `~/src` に配置することで権限問題を回避できる。

この構成により、launchd がどのような cwd で起動しても、どのような shell 環境でも確実に動作する。

---

## インストール / 更新手順

```bash
PLIST=~/Library/LaunchAgents/com.yoshiki.rttranslator.smokecheck.plist
cp ops/launchd/com.yoshiki.rttranslator.smokecheck.plist "$PLIST"
UID=$(id -u)
launchctl bootout "gui/${UID}" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/${UID}" "$PLIST"
launchctl kickstart -k "gui/${UID}/com.yoshiki.rttranslator.smokecheck"
```

---

## 検証手順

### plist の内容確認
```bash
UID=$(id -u)
launchctl print "gui/${UID}/com.yoshiki.rttranslator.smokecheck" | egrep -i "program|working|standard(out|err)"
```

### ログ確認
```bash
tail -n 40 /Users/nakamurayoshiki/src/realtime-translator-pwa-main/ops/logs/smokecheck.err
tail -n 40 /Users/nakamurayoshiki/src/realtime-translator-pwa-main/ops/logs/smokecheck.out
```

### 状態確認
```bash
cat /Users/nakamurayoshiki/src/realtime-translator-pwa-main/ops/logs/smokecheck.state
```

### ローテーション確認
```bash
ls -la /Users/nakamurayoshiki/src/realtime-translator-pwa-main/ops/logs/smokecheck.*
```

### 手動実行テスト
```bash
cd /Users/nakamurayoshiki/src/realtime-translator-pwa-main
./scripts/smoke_wrapper.sh
echo "Exit code: $?"
```

---

## アンインストール

```bash
PLIST=~/Library/LaunchAgents/com.yoshiki.rttranslator.smokecheck.plist
UID=$(id -u)
launchctl bootout "gui/${UID}" "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
```

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `getcwd: Operation not permitted` | TCC制限 (Documents/iCloud) | リポジトリを `~/src` に移動し、plist を更新 |
| shell-init 警告が stderr に出る | zsh の初期化処理 | bash に変更済み（本 plist） |
| `/health` が 404 | エンドポイント変更 | API_BASE と実際のパスを確認 |
| 403 | Cloud Run 認証設定 | `--allow-unauthenticated` を確認 |
| 5xx | アプリエラー | Cloud Run ログを確認 |
| 通知が表示されない | macOS 権限 | システム設定 → 通知 → osascript を許可 |
| smokecheck.out が空 | 正常（stdout に出力がない） | smokecheck.err を確認 |
| ローテーションされない | マーカーファイル問題 | `smokecheck.rotated_date` を削除して再実行 |

---

## 設計メモ

- **シェル**: `/bin/bash -lc` (zsh より shell-init ノイズが少ない)
- **StartInterval=600**: 10分間隔で実行
- **TOKEN 不使用**: 認証なしのヘルスチェックのみ実行し、秘密情報をログに出さない
- **絶対パス構成**: cwd に依存しない堅牢な設計
- **通知**: osascript で macOS Notification Center に送信
- **ログローテーション**: 日次、14日保持
