# Stripe決済画面で価格が100倍になる問題の解決ガイド

## 🚨 問題の詳細

**症状**: Stripeチェックアウト画面で価格が異常に高い
- **表示価格**: ¥5,001,200
- **正しい価格**: ¥5,000
- **倍率**: 約1000倍

**スクリーンショット分析**:
```
表示: ¥5,001,200
→ これは 5001200 円
→ DB保存値: 500120000 銭
```

## 🔍 原因

データベースの`tickets`テーブルに保存されている`price`値が間違っています。

### 正しいデータ構造

| 表示価格 | DB保存値（銭単位） | 計算 |
|---------|-----------------|------|
| ¥5,000  | 500000          | 5000 × 100 |
| ¥10,000 | 1000000         | 10000 × 100 |
| ¥3,000  | 300000          | 3000 × 100 |

### 現在の間違ったデータ

| 表示価格 | DB保存値（銭単位） | 問題 |
|---------|-----------------|------|
| ¥5,001,200 | 500120000    | 100倍多い |

## 📊 データの確認方法

### EC2で確認

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
./fix_ticket_price.sh
```

このスクリプトが以下を表示：
1. 全チケットの価格（銭と円の両方）
2. 異常な価格のチケット（price > 1000000）
3. 修正方法

### 手動でデータベース確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"
```

```sql
-- 全チケットの価格を確認
SELECT 
  id, 
  name, 
  price as price_cents,
  price/100 as price_yen,
  currency
FROM tickets 
ORDER BY id;
```

**期待される結果（正常）**:
```
 id | name | price_cents | price_yen | currency
----+------+-------------+-----------+----------
  1 | test |      500000 |      5000 | jpy
```

**実際の結果（異常）**:
```
 id | name | price_cents | price_yen | currency
----+------+-------------+-----------+----------
  1 | test |   500120000 |   5001200 | jpy
```

## ✅ 修正方法

### 方法1: 管理画面から修正（最も安全・推奨）

1. **ブラウザで管理画面を開く**
   ```
   http://18.178.182.252/admin
   ```

2. **チケット管理にアクセス**
   - 左メニューから「チケット管理」をクリック

3. **該当チケットを編集**
   - 価格が異常なチケットの「編集」ボタンをクリック

4. **正しい価格を入力**
   - 価格フィールド: `5000`（円）
   - **重要**: 「50012」ではなく「5000」を入力
   - 通貨: 「JPY (日本円)」を選択

5. **保存**
   - 「更新」ボタンをクリック
   - 成功メッセージを確認

6. **確認**
   - イベント詳細ページで「¥5,000」と表示されることを確認
   - 購入ボタンをクリックしてStripeチェックアウトで「¥5,000」を確認

### 方法2: SQLで直接修正（上級者向け）

```bash
ssh ec2-user@18.178.182.252

psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"
```

```sql
-- まず現在の価格を確認
SELECT id, name, price, price/100 as price_yen FROM tickets;

-- 特定のチケットIDを修正（例: ID=1を5000円に）
UPDATE tickets SET price = 500000 WHERE id = 1;
-- 5000円 = 500000銭

-- 複数のチケットを一括修正（例: すべてを5000円に）
-- ⚠️ 注意: これは全チケットを同じ価格にします
UPDATE tickets SET price = 500000;

-- 修正結果を確認
SELECT id, name, price, price/100 as price_yen FROM tickets;

-- 接続を終了
\q
```

### 価格変換表

| 円単位 | 銭単位（DB保存値） | SQL例 |
|-------|-----------------|-------|
| 3,000円 | 300000 | `UPDATE tickets SET price = 300000 WHERE id = X;` |
| 5,000円 | 500000 | `UPDATE tickets SET price = 500000 WHERE id = X;` |
| 8,000円 | 800000 | `UPDATE tickets SET price = 800000 WHERE id = X;` |
| 10,000円 | 1000000 | `UPDATE tickets SET price = 1000000 WHERE id = X;` |

## 🐛 なぜこの問題が発生したか

### 原因1: 管理画面で間違った値を入力

管理画面で「50012」と入力すると：
- 入力値: `50012`（円）
- 変換: `50012 × 100 = 5001200`（銭）
- DB保存: `5001200`
- Stripe表示: ¥50,012

さらに編集すると：
- 現在のDB値: `5001200`（銭）
- 管理画面表示: `5001200 / 100 = 50012`（円）
- ユーザーがそのまま保存
- 再変換: `50012 × 100 = 5001200`（銭）
- 繰り返すたびに100倍に...

### 原因2: 既存データが間違っている

最初にチケットを作成した時に、既に間違った価格で保存されていた可能性があります。

## 🔧 修正後の確認手順

### ステップ1: データベースで確認

```bash
psql "postgresql://postgres:Yota19990514@...streaming_platform" \
  -c "SELECT id, name, price, price/100 as price_yen, currency FROM tickets;"
```

**期待される結果**:
```
 id | name | price  | price_yen | currency
----+------+--------+-----------+----------
  1 | test | 500000 |      5000 | jpy
```

### ステップ2: アプリを再起動

```bash
pm2 restart streaming-app
pm2 logs streaming-app --lines 20
```

### ステップ3: イベント詳細ページで確認

```
http://18.178.182.252/events/[イベントslug]
```

**期待される表示**:
```
test
¥5,000  残り10枚
[購入する]
```

### ステップ4: Stripeチェックアウトで確認

1. 「購入する」ボタンをクリック
2. Stripeチェックアウト画面に遷移
3. **期待される表示**: `¥5,000`
4. **NG表示**: `¥5,001,200` または `¥50,012`

### ステップ5: テスト決済

- カード番号: `4242 4242 4242 4242`
- 有効期限: 未来の日付（例: `12/25`）
- CVC: 任意の3桁（例: `123`）
- 決済を完了して成功ページに遷移

## 📋 チェックリスト

データベース修正完了の確認：

- [ ] `./fix_ticket_price.sh` を実行して現在の価格を確認
- [ ] 異常な価格（price > 1000000）のチケットがないことを確認
- [ ] 管理画面またはSQLで価格を修正
- [ ] データベースで修正後の価格を確認（例: 500000 = 5000円）
- [ ] `pm2 restart streaming-app` でアプリ再起動
- [ ] イベント詳細ページで「¥5,000」表示を確認
- [ ] Stripeチェックアウトで「¥5,000」表示を確認
- [ ] テスト決済が正常に完了

## 🎯 期待される表示

### イベント詳細ページ

```
チケット購入

test
¥5,000  残り10枚
[購入する]
```

### Stripeチェックアウト画面

```
UMGフェス - test
¥5,000

連絡先情報
メールアドレス: [email]

支払い方法
カード
[カード情報入力フォーム]
```

## ❓ トラブルシューティング

### Q1: 管理画面で修正したのにまだ高い価格が表示される

**A**: ブラウザのキャッシュをクリアしてください。
```bash
# EC2でアプリも再起動
pm2 restart streaming-app

# ブラウザで
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Q2: データベースは修正したのにStripeで高い価格

**A**: アプリを再起動し、新しいセッションを作成してください。
```bash
pm2 restart streaming-app
```

既存のStripeセッションは古い価格を使用している可能性があります。新しく購入ボタンをクリックして新しいセッションを作成してください。

### Q3: 正しい価格がわからない

**A**: イベント主催者に確認するか、以下の方法で推定：
```sql
-- 現在の価格を確認
SELECT id, name, price, price/100 as current_yen FROM tickets;

-- もし current_yen が 5001200 なら、おそらく 5000 円が正しい
-- もし current_yen が 50012 なら、おそらく 500 円が正しい
```

### Q4: 複数のチケットが同じ問題

**A**: 一括修正が必要な場合：
```bash
# まず全チケットの価格を確認
psql "$DB_URL" -c "SELECT id, name, price/100 as price_yen FROM tickets;"

# 必要に応じて個別に修正
psql "$DB_URL" -c "UPDATE tickets SET price = 500000 WHERE id IN (1, 2, 3);"
```

## 📚 関連ファイル

- `fix_ticket_price.sh` - 価格確認・診断スクリプト
- `fix_currency_urgent.sh` - 通貨修正スクリプト
- `components/admin/TicketsManager.tsx` - チケット管理UI
- `app/api/admin/tickets/[id]/route.ts` - チケット更新API

## 🔗 リポジトリ

**URL**: https://github.com/yotamatsumaru/0222-VOD

---

## 🚀 今すぐ実行するコマンド

```bash
# EC2に接続
ssh ec2-user@18.178.182.252

# プロジェクトディレクトリに移動
cd /home/ec2-user/webapp

# 最新コードを取得
git pull origin main

# 価格を確認
./fix_ticket_price.sh

# 管理画面で修正するか、SQLで直接修正
# 方法1: 管理画面 http://18.178.182.252/admin
# 方法2: psql で直接修正（例）
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "UPDATE tickets SET price = 500000 WHERE id = 1;"

# アプリ再起動
pm2 restart streaming-app

# ブラウザでテスト
# http://18.178.182.252/events/[イベントslug]
```

---

**最終更新**: 2026/02/25  
**ステータス**: 診断スクリプト作成完了、データベース修正要実施
