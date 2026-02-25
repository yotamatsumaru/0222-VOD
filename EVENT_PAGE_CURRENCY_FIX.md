# イベント詳細ページでドル表示される問題の完全解決ガイド

## 🚨 問題の詳細

**症状**: イベント詳細ページでチケット価格が **$50,012** のようにドル表示される

**原因は2つ**:

### 1. データベースの`currency`が正しく設定されていない
- `tickets`テーブルの`currency`カラムが`NULL`、`'usd'`、またはその他の値
- 正しい値: `'jpy'`（小文字）

### 2. フロントエンドの通貨判定ロジックが間違っていた
- **旧コード**: `ticket.currency === 'JPY'` （大文字で比較）
- **DBの値**: `'jpy'`（小文字）
- **結果**: 一致せず、デフォルトでドル（$）表示

## ✅ 修正内容

### コード修正（完了済み）

**ファイル**: `components/TicketPurchase.tsx`

```tsx
// 修正前
{ticket.currency === 'JPY' ? '¥' : '$'}

// 修正後
{ticket.currency?.toLowerCase() === 'jpy' ? '¥' : '$'}
```

この修正により、データベースに `'jpy'`、`'JPY'`、`'Jpy'` のいずれが保存されていても正しく円マーク（¥）が表示されます。

### データベース修正（要実施）

EC2で以下のスクリプトを実行：

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main
./fix_currency_urgent.sh
```

## 🔧 EC2での完全な修正手順

### ステップ1: 最新コードを取得

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main
```

**期待される出力**:
```
From https://github.com/yotamatsumaru/0222-VOD
   d02e92c..e06ff11  main -> origin/main
Updating d02e92c..e06ff11
Fast-forward
 components/TicketPurchase.tsx | 2 +-
 fix_currency_urgent.sh        | 8 ++++++--
 2 files changed, 7 insertions(+), 3 deletions(-)
```

### ステップ2: データベースを修正

```bash
./fix_currency_urgent.sh
```

スクリプトが以下を実行します：

1. **現在のチケット情報表示**
   ```
   id | name | price  | price_yen | currency
   ---+------+--------+-----------+----------
    1 | test | 500000 |      5000 | usd
   ```

2. **問題のあるチケット確認**
   ```
   Found 1 ticket(s) with incorrect currency
   ```

3. **自動修正実行**
   ```
   UPDATE tickets SET currency = 'jpy' WHERE currency IS NULL OR currency != 'jpy';
   UPDATE 1
   ```

4. **修正後の確認**
   ```
   id | name | price  | price_yen | currency
   ---+------+--------+-----------+----------
    1 | test | 500000 |      5000 | jpy
   ```

### ステップ3: 価格の確認と修正（必要な場合）

もし価格が異常に高い場合（例: **¥50,012** で実際は **¥5,000** のはず）:

**方法A: 管理画面から修正（推奨）**

1. ブラウザで管理画面を開く: `http://18.178.182.252/admin`
2. 「チケット管理」をクリック
3. 該当チケットの「編集」ボタンをクリック
4. 価格フィールドに正しい金額を入力（例: `5000`）
5. 通貨で「JPY (日本円)」を選択
6. 「更新」ボタンをクリック

**方法B: SQLで直接修正**

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"
```

```sql
-- 特定のチケットの価格を修正（例: ID=1のチケットを5000円に）
UPDATE tickets SET price = 500000 WHERE id = 1;
-- 注: price は銭単位なので、5000円 = 500000

-- 確認
SELECT id, name, price, price/100 as price_yen, currency FROM tickets;

\q
```

### ステップ4: アプリを再起動

```bash
pm2 restart streaming-app
pm2 logs streaming-app --lines 20
```

### ステップ5: ブラウザでテスト

1. **ブラウザのキャッシュをクリア**（超重要！）
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - または、シークレット/プライベートウィンドウで開く

2. **イベント詳細ページにアクセス**
   ```
   http://18.178.182.252/events/[イベントslug]
   ```

3. **確認ポイント**:
   - ✅ チケット価格が **¥5,000** 形式で表示
   - ✅ 通貨記号が **¥**（円マーク）
   - ❌ **$50,012** のような表示はNG

## 🐛 価格が異常に高い原因

**ケース1: 既存データが間違っている**

スクリーンショットの **$50,012** は、データベースに `price = 5001200` が保存されている可能性があります。

```sql
-- 確認
SELECT id, name, price, price/100 as price_yen FROM tickets;

-- もし price = 5001200 の場合:
-- これは 50012.00 円 = $50,012 と解釈される
```

**正しいデータ**:
- 5,000円のチケット → `price = 500000`（銭単位）
- 表示: ¥5,000 または $50.00

**間違ったデータ**:
- `price = 5001200` → 表示: ¥50,012 または $50,012

**修正方法**:

```bash
# psqlで接続
psql "postgresql://postgres:Yota19990514@...streaming_platform"

# 現在の価格を確認
SELECT id, name, price, price/100 as display_price FROM tickets;

# 修正（例: ID=1のチケットを5000円に）
UPDATE tickets SET price = 500000 WHERE id = 1;

# 確認
SELECT id, name, price, price/100 as display_price FROM tickets;
```

**ケース2: 管理画面で間違った価格を入力**

管理画面で「50012」のような値を入力すると、`50012 * 100 = 5001200` になります。

**正しい入力**:
- 価格フィールド: `5000`（円）
- 保存される値: `500000`（銭）
- 表示: ¥5,000

## 📊 データベース診断コマンド

### 全チケットの詳細を確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" \
  -c "SELECT 
        id, 
        name, 
        price, 
        price/100 as price_yen, 
        currency,
        CASE 
          WHEN currency = 'jpy' THEN '✓ 正常'
          ELSE '✗ 要修正'
        END as status
      FROM tickets 
      ORDER BY id;"
```

### currencyの分布を確認

```bash
psql "postgresql://postgres:Yota19990514@...streaming_platform" \
  -c "SELECT currency, COUNT(*) as count FROM tickets GROUP BY currency;"
```

**期待される結果**:
```
 currency | count
----------+-------
 jpy      |     5
```

**NG例**:
```
 currency | count
----------+-------
 jpy      |     3
 usd      |     1
 (null)   |     1
```

### 価格の範囲を確認

```bash
psql "postgresql://postgres:Yota19990514@...streaming_platform" \
  -c "SELECT 
        MIN(price/100) as min_price_yen,
        MAX(price/100) as max_price_yen,
        AVG(price/100) as avg_price_yen
      FROM tickets;"
```

もし `max_price_yen` が異常に大きい（例: 50012）場合、データが間違っています。

## ✅ 修正完了チェックリスト

- [ ] EC2で `git pull origin main` 実行
- [ ] `./fix_currency_urgent.sh` 実行
- [ ] 全チケットの `currency = 'jpy'` 確認
- [ ] 全チケットの価格が適正範囲（例: 3000〜10000円）
- [ ] `pm2 restart streaming-app` 実行
- [ ] ブラウザのキャッシュクリア（Ctrl+Shift+R）
- [ ] イベント詳細ページで **¥** マーク表示確認
- [ ] 価格が正しい金額で表示（例: ¥5,000）
- [ ] **$** マーク表示されないこと確認

## 🎯 期待される表示

### 正しい表示（目標）

```
チケット購入

test
¥5,000  残り10枚
[購入する]
```

### 間違った表示（修正前）

```
チケット購入

test
$50,012  在庫あり
[購入する]
```

## ❓ トラブルシューティング

### Q1: スクリプトを実行したがまだドル表示

**A**: ブラウザのキャッシュをクリアしてください。
- ハードリロード（Ctrl+Shift+R）
- シークレットウィンドウで確認
- 別のブラウザで確認

### Q2: 円マークになったが価格が異常に高い

**A**: データベースの価格を修正してください。

```sql
-- psqlで
UPDATE tickets SET price = 500000 WHERE id = 1;  -- 5000円の場合
```

または、管理画面から該当チケットを編集して正しい価格を入力。

### Q3: 修正後に新しく作成したチケットもドル表示

**A**: 通貨フィールドの選択を確認してください。

1. 管理画面でチケット作成
2. 「通貨」フィールドで **「JPY (日本円)」** を選択
3. 保存

### Q4: データベース接続エラー

**A**: `.env.local` を確認してください。

```bash
cat /home/ec2-user/webapp/.env.local | grep DATABASE_URL
```

正しい値:
```
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
```

## 📚 関連ファイル

- `components/TicketPurchase.tsx` - イベント詳細ページのチケット表示コンポーネント（修正済み）
- `fix_currency_urgent.sh` - データベース自動修正スクリプト
- `URGENT_CURRENCY_FIX.md` - 緊急対応ガイド
- `TICKET_CURRENCY_FIX.md` - チケット通貨バグ詳細ガイド

## 🔗 最新コミット

**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD  
**コミット**: `e06ff11` - fix: イベント詳細ページのチケット通貨表示を修正

---

**最終更新**: 2026/02/25  
**ステータス**: コード修正完了、データベース修正要実施
