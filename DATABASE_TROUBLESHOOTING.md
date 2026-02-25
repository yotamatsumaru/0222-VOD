# データベース接続トラブルシューティングガイド

## 🔴 問題: イベント・アーティスト・チケットが新規作成できない

### 症状
- 管理画面でフォームに入力して「保存」をクリックしても保存されない
- エラーメッセージが表示される
- または何も反応しない

---

## 🔍 原因の特定

### 1. ブラウザコンソールでエラー確認

1. **F12キー** を押してデベロッパーツールを開く
2. **Console** タブを選択
3. 保存ボタンをクリック
4. 表示されるエラーメッセージを確認

**期待されるログ**:
```javascript
// 正常な場合
POST /api/admin/events 201 Created

// エラーの場合
POST /api/admin/events 500 Internal Server Error
API Error Response: {
  status: 500,
  error: { error: "Failed to create event", details: "..." }
}
```

### 2. サーバーログでエラー確認（EC2）

```bash
# EC2にSSH接続
ssh ec2-user@18.178.182.252

# PM2ログ確認
pm2 logs streaming-app --err --lines 50

# 特定のエラーを検索
pm2 logs streaming-app | grep "error\|Error\|ERROR"
```

**よくあるエラー**:

#### A. データベース接続エラー
```
Error: connect ETIMEDOUT
Error: Connection terminated due to connection timeout
ECONNREFUSED
```

#### B. 認証エラー
```
Error: password authentication failed for user "postgres"
Error: no pg_hba.conf entry for host
```

#### C. データベース存在エラー
```
Error: database "streaming" does not exist
```

---

## ✅ 解決方法

### 問題A: データベース接続タイムアウト

**原因**: RDSのセキュリティグループがEC2からの接続を許可していない

**解決策**:

1. **AWS Console → RDS → database-2 → Connectivity & security**

2. **VPC security groups** をクリック

3. **Inbound rules** タブで以下を確認:
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port range: 5432
   Source: <EC2のセキュリティグループ> または EC2のPrivate IP
   ```

4. ルールがない場合は **Edit inbound rules** → **Add rule**:
   ```
   Type: PostgreSQL
   Source: Custom → <EC2のセキュリティグループID>
   ```

5. **Save rules**

### 問題B: データベース名が間違っている

**確認方法**:

```bash
# EC2にSSH
ssh ec2-user@18.178.182.252

# PostgreSQLクライアントで接続テスト
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/postgres" -c "SELECT datname FROM pg_database;"

# 出力例:
#   datname
# --------------
#  postgres
#  template1
#  template0
#  streaming          ← このデータベース名を使用
# (4 rows)
```

**正しいデータベース名を .env.local に設定**:

```bash
cd /home/ec2-user/webapp
nano .env.local

# DATABASE_URL を修正
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming

# Ctrl+O (保存), Enter, Ctrl+X (終了)

# アプリ再起動
pm2 restart streaming-app
```

### 問題C: テーブルが存在しない

**確認方法**:

```bash
# EC2にSSH
ssh ec2-user@18.178.182.252

# データベースに接続
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming"

# テーブル一覧確認
\dt

# 期待される出力:
#              List of relations
#  Schema |        Name               | Type  |  Owner
# --------+---------------------------+-------+----------
#  public | artists                   | table | postgres
#  public | events                    | table | postgres
#  public | tickets                   | table | postgres
#  public | purchases                 | table | postgres
#  public | users                     | table | postgres
#  public | password_reset_tokens     | table | postgres
```

**テーブルがない場合**: スキーマを作成

```bash
# schema.sql が存在する場合
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming" -f schema.sql

# または手動でテーブル作成（SPECIFICATION.md のSQL定義参照）
```

### 問題D: パスワードが間違っている

**確認方法**:

```bash
# 接続テスト
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/postgres" -c "SELECT 1"

# エラーが出る場合、パスワードを再確認
# AWS Console → RDS → database-2 → Modify → Master password
```

---

## 📝 DATABASE_URL 設定チェックリスト

正しい `DATABASE_URL` の形式:

```bash
postgresql://<username>:<password>@<host>:<port>/<database>

# 例:
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming
```

**各要素の確認**:

- ✅ **Username**: `postgres` （RDSのマスターユーザー名）
- ✅ **Password**: `Yota19990514` （正しいパスワード）
- ✅ **Host**: `database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com` （RDSエンドポイント）
- ✅ **Port**: `5432` （PostgreSQLデフォルト）
- ❓ **Database**: `streaming` **または** `streaming_platform` （要確認）

---

## 🧪 データベース接続テスト手順

### EC2上でテスト

```bash
# 1. EC2にSSH
ssh ec2-user@18.178.182.252

# 2. 接続テスト（postgres データベース）
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/postgres" -c "SELECT 1"

# 成功した場合: "?column? \n---------- \n 1"

# 3. データベース一覧確認
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/postgres" -c "SELECT datname FROM pg_database WHERE datistemplate = false;"

# 4. アプリ用データベースに接続
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming" -c "\dt"

# テーブルが表示されればOK
```

### ローカルでテスト（Node.js）

```javascript
// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Connected:', res.rows[0]);
  }
  pool.end();
});
```

実行:
```bash
cd /home/ec2-user/webapp
node test-db.js
```

---

## 🔧 .env.local ファイルの確認と修正

### EC2上で確認

```bash
# EC2にSSH
ssh ec2-user@18.178.182.252

# .env.local を確認
cd /home/ec2-user/webapp
cat .env.local | grep DATABASE_URL

# 出力例:
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming
```

### 修正方法

```bash
# .env.local を編集
nano .env.local

# DATABASE_URL の行を修正（正しいデータベース名に変更）
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming

# 保存: Ctrl+O, Enter
# 終了: Ctrl+X

# アプリ再起動
pm2 restart streaming-app

# ログ確認
pm2 logs streaming-app --lines 20
```

---

## 🎯 推奨される確認順序

1. **ブラウザコンソールでエラー確認**（F12 → Console）
2. **EC2でサーバーログ確認**（`pm2 logs`）
3. **データベース接続テスト**（`psql` コマンド）
4. **データベース名確認**（`SELECT datname FROM pg_database`）
5. **.env.local のDATABASE_URL修正**
6. **PM2再起動**（`pm2 restart streaming-app`）
7. **再度ブラウザで動作確認**

---

## 📞 サポート情報

### よくある質問

**Q: データベース名は `streaming` と `streaming_platform` どちらですか？**

A: EC2上で以下のコマンドで確認してください：
```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/postgres" -c "SELECT datname FROM pg_database WHERE datistemplate = false;"
```

**Q: RDSのセキュリティグループ設定はどこで確認できますか？**

A: AWS Console → RDS → database-2 → Connectivity & security → VPC security groups

**Q: パスワードを忘れました**

A: AWS Console → RDS → database-2 → Modify → Master password で再設定できます

**Q: EC2から接続できるが、ローカルから接続できない**

A: RDSのセキュリティグループがEC2からのみ許可している可能性があります。開発環境からも接続したい場合は、セキュリティグループにローカルIPを追加してください。

---

## 📚 関連ドキュメント

- [SPECIFICATION.md](./SPECIFICATION.md) - データベーススキーマ定義
- [README.md](./README.md) - 環境変数設定
- [EC2_DEPLOY_GUIDE.md](./EC2_DEPLOY_GUIDE.md) - デプロイ手順

---

**最終更新**: 2026-02-23  
**バージョン**: 1.0
