# チケット購入画面がドル表示になる問題 - 緊急対応ガイド

## 🚨 現象

- チケット購入画面でStripeチェックアウトに遷移すると、価格が **$（ドル）** で表示される
- 日本円（¥）で設定したはずなのに、ドル表示になってしまう

## 🔍 原因

データベースの `tickets` テーブルで、既存チケットの `currency` カラムが以下のいずれかの状態になっている：

1. `NULL`（未設定）
2. `'usd'`（米ドル）
3. その他の値（`'jpy'` 以外）

Stripeはこの `currency` 値を使ってチェックアウトページを表示するため、`currency` が正しく設定されていないとドル表示になります。

## ✅ 解決方法

### **方法1: 自動修正スクリプトを実行（推奨）**

EC2にSSH接続して、以下を実行：

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main  # 最新コードを取得
./fix_currency_urgent.sh  # 自動修正スクリプト実行
```

このスクリプトは以下を自動で実行します：
1. 現在のチケット情報表示
2. 問題のあるチケット（currency != 'jpy'）を確認
3. 全チケットの currency を 'jpy' に修正
4. 修正後の状態を表示

### **方法2: 手動でSQLを実行**

EC2にSSH接続して、psqlで直接修正：

```bash
ssh ec2-user@18.178.182.252

# データベースに接続
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"
```

psqlプロンプトで以下を実行：

```sql
-- 1. 現在の状態を確認
SELECT id, name, price, currency FROM tickets ORDER BY id;

-- 2. 問題のあるチケットを確認
SELECT id, name, currency FROM tickets WHERE currency IS NULL OR currency != 'jpy';

-- 3. 修正実行
UPDATE tickets SET currency = 'jpy' WHERE currency IS NULL OR currency != 'jpy';

-- 4. 修正結果を確認
SELECT id, name, price, currency FROM tickets ORDER BY id;

-- 5. 接続を終了
\q
```

### **方法3: 管理画面から個別に修正**

1. 管理画面にログイン: `http://18.178.182.252/admin`
2. 「チケット管理」をクリック
3. 各チケットの「編集」ボタンをクリック
4. **通貨フィールドで「JPY (日本円)」を選択**
5. 「更新」ボタンをクリック
6. 全てのチケットで繰り返す

## 🔧 修正後の手順

### 1. アプリケーションを再起動

```bash
pm2 restart streaming-app
pm2 logs streaming-app --lines 20
```

### 2. ブラウザのキャッシュをクリア

**重要**: ブラウザが古い情報をキャッシュしている可能性があります。

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- または、シークレット/プライベートウィンドウで開く

### 3. テスト確認

1. ログインして、イベント詳細ページにアクセス
2. チケットの「購入する」ボタンをクリック
3. Stripeチェックアウトページで価格表示を確認

**期待される表示**:
```
¥5,000  ← ✅ 正しい（円マーク）
```

**NG表示**:
```
$5,000  ← ❌ 間違い（ドルマーク）
$50.00  ← ❌ 間違い（ドルマーク、価格も違う）
```

## 🐛 デバッグ方法

### チケットデータを直接確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "SELECT * FROM tickets;"
```

### 特定のチケットIDを確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "SELECT id, name, price, currency FROM tickets WHERE id = 1;"
```

### APIレスポンスを確認

ブラウザの開発者ツール（F12）で：

1. Networkタブを開く
2. チケット購入ボタンをクリック
3. `/api/stripe/checkout` のリクエストを確認
4. Responseタブで `sessionId` と `url` を確認
5. Stripe URLに遷移する前に、Requestタブでリクエストボディを確認

**確認ポイント**:
- Request bodyに含まれる `ticketId` が正しいか
- その `ticketId` のチケットの `currency` が `'jpy'` になっているか

### サーバーログを確認

```bash
pm2 logs streaming-app --lines 50
```

チェックアウトAPIのログで以下を確認：
```
Checkout API: Creating session for ticket ID: X, currency: jpy, amount: 500000
```

もし `currency: usd` や `currency: null` になっていたら、データベースが修正されていません。

## ❓ よくある質問

### Q1: スクリプトを実行したのにまだドル表示される

**A1**: ブラウザのキャッシュをクリアしてください。
- ハードリロード（Ctrl+Shift+R）
- シークレットウィンドウで開く
- ブラウザのキャッシュを完全にクリア

**A2**: アプリを再起動してください。
```bash
pm2 restart streaming-app
```

### Q2: データベースは修正したが、まだドル表示

**原因**: Stripeチェックアウトセッションがキャッシュされている可能性

**解決策**:
1. 新しいチケットを作成してテスト
2. 別のイベントのチケットで試す
3. Stripeのテストモードをリフレッシュ

### Q3: 修正後に新しく作成したチケットもドルになる

**原因**: チケット作成時に currency が正しく保存されていない

**確認**:
1. 管理画面でチケット作成画面を開く
2. 「通貨」フィールドが表示されるか確認
3. 「JPY (日本円)」が選択されているか確認
4. もし表示されない場合、ブラウザのキャッシュをクリア

### Q4: fix_currency_urgent.sh が見つからない

**解決策**:
```bash
cd /home/ec2-user/webapp
git pull origin main  # 最新コードを取得
ls -la fix_currency_urgent.sh  # ファイルが存在するか確認
chmod +x fix_currency_urgent.sh  # 実行権限を付与
./fix_currency_urgent.sh  # 実行
```

## 📊 データベーススキーマ確認

### ticketsテーブルの構造

```sql
-- currency カラムの情報を確認
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' AND column_name = 'currency';
```

**期待される結果**:
- `column_name`: currency
- `data_type`: character varying
- `is_nullable`: YES または NO
- `column_default`: NULL または 'jpy'

### 全チケットの currency を確認

```sql
-- currency の分布を確認
SELECT 
  currency, 
  COUNT(*) as count 
FROM tickets 
GROUP BY currency;
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

## 🎯 チェックリスト

修正完了の確認：

- [ ] データベースで全チケットの `currency` が `'jpy'`
- [ ] `pm2 restart streaming-app` 実行済み
- [ ] ブラウザのキャッシュをクリア済み
- [ ] 管理画面でチケット編集画面に「通貨」フィールド表示
- [ ] Stripeチェックアウトで **¥** マーク表示
- [ ] Stripeチェックアウトで **$** マーク表示されない
- [ ] テスト決済が成功する

## 📞 それでも解決しない場合

以下の情報を確認してください：

1. **データベースの状態**:
```bash
psql "postgresql://postgres:Yota19990514@...streaming_platform" -c "SELECT id, name, price, currency FROM tickets;"
```

2. **アプリのログ**:
```bash
pm2 logs streaming-app --lines 100
```

3. **ブラウザコンソール**:
- F12を押して開発者ツールを開く
- Consoleタブでエラーを確認
- Networkタブで `/api/stripe/checkout` のレスポンスを確認

4. **Stripeダッシュボード**:
- https://dashboard.stripe.com/test/payments
- 最新のチェックアウトセッションの通貨を確認

5. **環境変数**:
```bash
cat /home/ec2-user/webapp/.env.local | grep STRIPE
```

---

## 📚 関連ドキュメント

- `TICKET_CURRENCY_FIX.md` - 詳細な修正ガイド
- `fix_ticket_currency.sql` - SQL修正スクリプト
- `fix_currency_urgent.sh` - 自動修正スクリプト
- `FIX_SUMMARY_20260225.md` - 全体サマリー

---

**最終更新**: 2026/02/25  
**対応者**: AI Assistant  
**ステータス**: 緊急対応手順
