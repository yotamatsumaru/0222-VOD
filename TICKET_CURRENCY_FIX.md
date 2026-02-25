# チケット通貨表示バグ修正ガイド

## 🐛 問題の詳細

### 現象
- Stripeチェックアウトページで通貨が **$ (米ドル)** で表示される
- 日本円（JPY）で設定したはずのチケットがUSDで表示される

### 原因
1. **チケット管理画面にcurrencyフィールドがない**
   - チケット作成・編集時にcurrencyを選択・変更できない
   - デフォルト値（jpy）は設定されているが、フォームで確認・変更不可

2. **チケット更新APIでcurrencyが更新されない**
   - `/api/admin/tickets/[id]` (PATCH) でcurrencyフィールドが含まれていない
   - 既存チケットを編集するとcurrencyがNULLまたは不正な値になる可能性

3. **データベースの既存データ**
   - 既に作成済みのチケットでcurrencyが正しく設定されていない可能性

## ✅ 修正内容

### 1. チケット管理画面にcurrency選択フィールドを追加
**ファイル**: `components/admin/TicketsManager.tsx`

```tsx
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    通貨
  </label>
  <select
    name="currency"
    value={formData.currency}
    onChange={handleChange}
    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
  >
    <option value="jpy">JPY (日本円)</option>
    <option value="usd">USD (米ドル)</option>
  </select>
</div>
```

### 2. チケット更新APIにcurrency対応を追加
**ファイル**: `app/api/admin/tickets/[id]/route.ts`

- リクエストボディから `currency` を取得
- UPDATE文に `currency = COALESCE($4, currency)` を追加
- パラメータ配列に `currency` を追加

### 3. 既存データの修正SQLスクリプト
**ファイル**: `fix_ticket_currency.sql`

```sql
-- 既存のチケットでcurrencyがNULLまたはusdになっているものをjpyに修正
UPDATE tickets 
SET currency = 'jpy' 
WHERE currency IS NULL OR currency != 'jpy';

-- 修正結果を確認
SELECT id, name, price, currency, event_id 
FROM tickets 
ORDER BY id;
```

## 🚀 EC2での適用手順

### 1. コードのデプロイ

```bash
# EC2にSSH接続
ssh ec2-user@18.178.182.252

# プロジェクトディレクトリに移動
cd /home/ec2-user/webapp

# 最新コードを取得
git pull origin main

# デプロイ実行
./deploy.sh
```

### 2. データベースの修正

```bash
# データベースに接続
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

# 現在のチケット通貨を確認
SELECT id, name, price, currency, event_id FROM tickets ORDER BY id;

# 通貨をJPYに修正
UPDATE tickets SET currency = 'jpy' WHERE currency IS NULL OR currency != 'jpy';

# 修正結果を確認
SELECT id, name, price, currency, event_id FROM tickets ORDER BY id;

# 接続を終了
\q
```

または、SQLファイルを直接実行：

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -f fix_ticket_currency.sql
```

### 3. アプリケーションの再起動

```bash
# PM2でアプリを再起動
pm2 restart streaming-app

# ログを確認
pm2 logs streaming-app --lines 50
```

## 🧪 テスト手順

### 1. 管理画面でのテスト

1. **ブラウザで管理画面を開く**:
   ```
   http://18.178.182.252/admin
   ```

2. **チケット管理画面にアクセス**:
   - 左メニューから「チケット管理」をクリック

3. **新規チケット作成**:
   - 「新規チケット作成」ボタンをクリック
   - 各項目を入力：
     - イベント: 任意のイベントを選択
     - チケット名: 「テストチケット」
     - 価格: `5000`（円）
     - **通貨**: `JPY (日本円)` を選択 ← **新機能**
     - 在庫数: `10`
   - 「作成」ボタンをクリック
   - 成功メッセージを確認

4. **既存チケットの編集**:
   - 任意のチケットの「編集」ボタンをクリック
   - **通貨フィールドが表示されることを確認** ← **新機能**
   - 通貨が `JPY (日本円)` になっていることを確認
   - 必要に応じて他の項目を編集
   - 「更新」ボタンをクリック
   - 成功メッセージを確認

### 2. チェックアウト画面でのテスト

1. **ログイン**:
   ```
   http://18.178.182.252/login
   ```
   テストユーザーでログイン

2. **イベント詳細ページにアクセス**:
   ```
   http://18.178.182.252/events/[イベントslug]
   ```

3. **チケット購入ボタンをクリック**:
   - 「購入する」ボタンをクリック
   - Stripeチェックアウトページに遷移

4. **通貨表示を確認**:
   - チケット価格が **¥5,000** と表示されることを確認
   - 通貨記号が **¥** （円マーク）であることを確認
   - **$ 表示されないことを確認** ← **修正ポイント**

5. **テスト決済**:
   - Stripe テストカード番号: `4242 4242 4242 4242`
   - 有効期限: 未来の日付（例: `12/25`）
   - CVC: 任意の3桁（例: `123`）
   - 決済を完了して成功ページに遷移することを確認

### 3. データベースでの確認

```bash
# データベースに接続
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

# 全チケットのcurrency確認
SELECT id, name, price, currency FROM tickets ORDER BY id;

# 結果例:
#  id |      name      |  price  | currency 
# ----+----------------+---------+----------
#   1 | 一般チケット   | 500000  | jpy
#   2 | VIPチケット    | 1000000 | jpy

# 全てのチケットで currency = 'jpy' であることを確認
\q
```

## 📋 チェックリスト

- [ ] EC2にSSH接続できる
- [ ] 最新コードをgit pullした
- [ ] データベースに接続できる
- [ ] 既存チケットのcurrencyを確認した
- [ ] fix_ticket_currency.sqlを実行した（必要な場合）
- [ ] 全チケットのcurrencyが'jpy'になった
- [ ] ./deploy.shを実行した
- [ ] PM2でアプリが正常に起動している
- [ ] 管理画面でチケット作成画面に「通貨」フィールドが表示される
- [ ] 管理画面でチケット編集画面に「通貨」フィールドが表示される
- [ ] 新規チケット作成時にcurrencyを選択できる
- [ ] 既存チケット編集時にcurrencyを変更できる
- [ ] Stripeチェックアウトで価格が「¥5,000」形式で表示される
- [ ] Stripeチェックアウトで通貨が「$」ではなく「¥」で表示される
- [ ] テスト決済が正常に完了する

## 🔍 トラブルシューティング

### ケース1: チェックアウトでまだ$表示される

**原因**: データベースのチケットcurrencyが更新されていない

**解決策**:
```bash
# データベースで確認
psql "postgresql://postgres:Yota19990514@...streaming_platform" -c "SELECT id, name, currency FROM tickets;"

# currencyがnullまたはusdの場合、修正
psql "postgresql://postgres:Yota19990514@...streaming_platform" -c "UPDATE tickets SET currency = 'jpy' WHERE currency IS NULL OR currency = 'usd';"
```

### ケース2: 管理画面で通貨フィールドが表示されない

**原因**: ブラウザキャッシュが残っている

**解決策**:
- ブラウザで**ハードリロード** (Ctrl+Shift+R または Cmd+Shift+R)
- ブラウザのキャッシュをクリア
- シークレット/プライベートウィンドウで開く

### ケース3: チケット編集後もcurrencyがnullになる

**原因**: APIが正しくデプロイされていない

**解決策**:
```bash
# EC2で最新コードを確認
cd /home/ec2-user/webapp
git log --oneline -5

# app/api/admin/tickets/[id]/route.ts に currency が含まれているか確認
grep -n "currency" app/api/admin/tickets/[id]/route.ts

# PM2を再起動
pm2 restart streaming-app
pm2 logs streaming-app --lines 50
```

## 📚 関連ファイル

- `components/admin/TicketsManager.tsx` - チケット管理UI（通貨フィールド追加）
- `app/api/admin/tickets/route.ts` - チケット作成API（currency対応済み）
- `app/api/admin/tickets/[id]/route.ts` - チケット更新API（currency対応追加）
- `app/api/stripe/checkout/route.ts` - Stripeチェックアウト作成API（currency使用）
- `fix_ticket_currency.sql` - データベース修正スクリプト

## 📖 データベーススキーマ

### ticketsテーブル

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,           -- 価格（最小単位：銭）
  currency VARCHAR(3) NOT NULL,     -- 通貨コード（jpy, usdなど）
  stock INTEGER,                     -- 在庫数（NULLは無制限）
  sold INTEGER DEFAULT 0,            -- 販売済み枚数
  is_active BOOLEAN DEFAULT true,    -- 販売中かどうか
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 価格と通貨の関係

- **price**: Stripeの仕様に従い、最小単位で保存
  - JPY: 1円 = 100銭 → ¥5,000 = `500000`
  - USD: 1ドル = 100セント → $50.00 = `5000`
- **currency**: ISO 4217通貨コード
  - `'jpy'`: 日本円
  - `'usd'`: 米ドル
  - `'eur'`: ユーロ など

## 🎯 まとめ

この修正により：

✅ **チケット管理画面で通貨を選択・編集可能**  
✅ **チケット更新時にcurrencyが正しく保存される**  
✅ **Stripeチェックアウトで正しい通貨記号（¥）が表示される**  
✅ **既存データも修正可能**

問題が解決しない場合は、上記のトラブルシューティングを参照するか、ログを確認してください。

## 📞 サポート

問題が続く場合：
1. EC2ログを確認: `pm2 logs streaming-app`
2. ブラウザコンソール（F12）でエラーを確認
3. データベースで直接データを確認

---

**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD  
**最新コミット**: チケット通貨表示バグ修正
