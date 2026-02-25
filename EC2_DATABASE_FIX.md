# DATABASE_URL 修正ガイド（EC2）

## ✅ 正しいデータベース名: `streaming_platform`

---

## 🚀 EC2での修正手順

### ステップ1: EC2にSSH接続

```bash
ssh ec2-user@18.178.182.252
```

### ステップ2: .env.local を編集

```bash
cd /home/ec2-user/webapp
nano .env.local
```

### ステップ3: DATABASE_URL を修正

**❌ 間違った設定**:
```bash
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming
```

**✅ 正しい設定**:
```bash
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
```

**変更箇所**: `streaming` → `streaming_platform`

### ステップ4: 保存して終了

```
Ctrl + O   (保存)
Enter      (確認)
Ctrl + X   (終了)
```

### ステップ5: 接続テスト

```bash
# PostgreSQLに接続してテスト
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "SELECT current_database();"
```

**期待される出力**:
```
 current_database
------------------
 streaming_platform
(1 row)
```

### ステップ6: テーブル存在確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "\dt"
```

**期待される出力**:
```
             List of relations
 Schema |         Name              | Type  |  Owner
--------+---------------------------+-------+----------
 public | artists                   | table | postgres
 public | events                    | table | postgres
 public | password_reset_tokens     | table | postgres
 public | purchases                 | table | postgres
 public | tickets                   | table | postgres
 public | users                     | table | postgres
(6 rows)
```

✅ 6つのテーブルすべてが表示されればOK

### ステップ7: 最新コードをデプロイ

```bash
cd /home/ec2-user/webapp
git pull origin main
./deploy.sh
```

**deploy.shの内容**（確認用）:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Git pull
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart streaming-app

echo "✅ Deployment completed!"
```

### ステップ8: PM2ログ確認

```bash
pm2 logs streaming-app --lines 20
```

**正常なログの例**:
```
[streaming-app] Server running on http://localhost:3000
[streaming-app] Database connected
```

**エラーがある場合のログ**:
```
[streaming-app] Error: connect ETIMEDOUT
[streaming-app] Error: database "streaming" does not exist
```
→ .env.local の修正が反映されていない可能性。`pm2 restart streaming-app` を再実行。

---

## 🧪 動作確認

### 1. ブラウザで管理画面を開く

```
http://18.178.182.252/admin
```

### 2. イベント作成テスト

**イベント管理** → **新規作成**

- アーティスト: （既存のアーティストを選択、なければアーティスト管理で作成）
- タイトル: 「テストイベント」
- 説明: 「データベース接続テスト」
- 配信開始日時: 任意
- ステータス: 配信予定
- **保存**

**期待される結果**:
```
✅ 「イベントを作成しました」というアラート
✅ イベント一覧に表示される
```

**エラーが出る場合**:
```
❌ エラー (500): Failed to create event

詳細: database "streaming" does not exist
```
→ .env.local が正しく修正されていない、または PM2 が再起動されていない

### 3. アーティスト作成テスト

**アーティスト管理** → **新規作成**

- 名前: 「テストアーティスト」
- 説明: 「テスト」
- **保存**

### 4. チケット作成テスト

**チケット管理** → **新規作成**

- イベント: 上記で作成したイベント
- チケット名: 「テストチケット」
- 価格: 100（1円）
- **保存**

---

## 🔍 トラブルシューティング

### 問題A: 「database "streaming" does not exist」エラーが続く

**原因**: .env.local の変更が反映されていない

**解決策**:

1. .env.local を再確認
   ```bash
   cat /home/ec2-user/webapp/.env.local | grep DATABASE_URL
   ```
   
   出力:
   ```
   DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
   ```
   
   `streaming_platform` になっているか確認

2. PM2を完全に再起動
   ```bash
   pm2 stop streaming-app
   pm2 start npm --name "streaming-app" -- start
   ```

3. または、PM2を削除して再作成
   ```bash
   pm2 delete streaming-app
   cd /home/ec2-user/webapp
   pm2 start npm --name "streaming-app" -- start
   pm2 save
   ```

### 問題B: 「Connection timeout」エラー

**原因**: RDSのセキュリティグループがEC2からの接続を許可していない

**解決策**:

1. **AWS Console → RDS → database-2**
2. **Connectivity & security** タブ
3. **VPC security groups** をクリック
4. **Inbound rules** タブ
5. PostgreSQL (5432) のルールがあるか確認

**ルールがない場合**:
- **Edit inbound rules** → **Add rule**
- Type: PostgreSQL
- Port: 5432
- Source: EC2のセキュリティグループ または EC2のPrivate IP
- **Save rules**

### 問題C: テーブルが存在しない

**症状**:
```bash
psql ... -c "\dt"
Did not find any relations.
```

**解決策**: スキーマを作成

```bash
cd /home/ec2-user/webapp

# schema.sql が存在する場合
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -f schema.sql

# または、SPECIFICATION.md のSQL定義を使用
```

**schema.sql の例** (SPECIFICATION.md より):
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... 他のテーブル（SPECIFICATION.md 参照）
```

---

## 📝 完全な .env.local 設定例

```bash
# Database
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# JWT & Admin
JWT_SECRET=your_jwt_secret_key_min_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# App URL
NEXT_PUBLIC_APP_URL=http://18.178.182.252

# CloudFront (Optional)
# CLOUDFRONT_DOMAIN=d3tcssbjmdt7t.cloudfront.net
# CLOUDFRONT_KEY_PAIR_ID=APKAxxxxx
# CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

---

## ✅ チェックリスト

修正後、以下を確認してください：

- [ ] .env.local で `DATABASE_URL` が `streaming_platform` を使用
- [ ] psql コマンドで接続できる
- [ ] テーブルが6つ存在する（users, artists, events, tickets, purchases, password_reset_tokens）
- [ ] PM2 が正常に起動している（`pm2 status`）
- [ ] PM2 ログにエラーがない（`pm2 logs streaming-app`）
- [ ] git pull でコードが最新（`git log -1`）
- [ ] ビルドが成功している（`npm run build`）
- [ ] 管理画面でイベント作成ができる
- [ ] 管理画面でアーティスト作成ができる
- [ ] 管理画面でチケット作成ができる

---

## 📞 サポート

### 問題が解決しない場合

以下の情報を確認してください：

1. **PM2 ログ**
   ```bash
   pm2 logs streaming-app --lines 50 --err
   ```

2. **.env.local の内容**（DATABASE_URLのみ）
   ```bash
   grep DATABASE_URL /home/ec2-user/webapp/.env.local
   ```

3. **PostgreSQL接続テスト結果**
   ```bash
   psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" -c "SELECT 1"
   ```

4. **ブラウザコンソールのエラー**（F12 → Console）

---

**最終更新**: 2026-02-23  
**バージョン**: 1.0
