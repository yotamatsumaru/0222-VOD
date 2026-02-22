# データベースセットアップガイド

## 🗄️ PostgreSQL設定手順

### 1. PostgreSQLのインストールと起動確認

```bash
# インストール済みか確認
psql --version

# 起動状態確認
sudo systemctl status postgresql

# 起動していない場合
sudo systemctl start postgresql
sudo systemctl enable postgresql  # 自動起動設定
```

### 2. データベースとユーザーの作成

```bash
# PostgreSQLに管理者としてログイン
sudo -u postgres psql

# PostgreSQL内で以下のSQLを実行：
CREATE USER streaming_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE streaming_platform OWNER streaming_user;
GRANT ALL PRIVILEGES ON DATABASE streaming_platform TO streaming_user;

# 接続確認
\c streaming_platform
\q
```

### 3. 環境変数の設定

`.env.local`ファイルを作成/更新：

```bash
# データベース接続URL（実際のパスワードに置き換え）
DATABASE_URL=postgresql://streaming_user:your_secure_password_here@localhost:5432/streaming_platform

# Stripe設定（本番環境用キーに置き換え）
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# JWT認証用シークレット（ランダムな文字列を生成）
JWT_SECRET=your_jwt_secret_32_characters_minimum

# 管理画面認証
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# アプリケーションURL（実際のドメインに置き換え）
NEXT_PUBLIC_APP_URL=https://your-domain.com

# CloudFront DRM（オプション）
CLOUDFRONT_PRIVATE_KEY=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_DOMAIN=
```

### 4. データベースマイグレーション

```bash
cd /path/to/webapp

# 依存関係のインストール
npm install

# マイグレーション実行
npm run db:migrate

# サンプルデータ投入（オプション）
npm run db:seed
```

### 5. 接続テスト

```bash
# psqlで直接接続テスト
psql -U streaming_user -d streaming_platform -h localhost -c "SELECT 1;"

# パスワードを求められたら、上で設定したパスワードを入力
```

## ⚠️ トラブルシューティング

### エラー: `ECONNREFUSED`

**原因**: PostgreSQLが起動していないか、接続情報が間違っている

**解決方法**:
```bash
# PostgreSQL起動確認
sudo systemctl status postgresql

# 起動していない場合
sudo systemctl start postgresql

# DATABASE_URLが正しいか確認
cat .env.local | grep DATABASE_URL

# 接続テスト
psql -U streaming_user -d streaming_platform -h localhost
```

### エラー: `password authentication failed`

**原因**: パスワードが間違っているか、認証方法が未設定

**解決方法**:
```bash
# pg_hba.confを編集
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 以下の行を追加/確認（md5認証を有効化）
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# PostgreSQL再起動
sudo systemctl restart postgresql

# パスワードをリセット（必要な場合）
sudo -u postgres psql
ALTER USER streaming_user WITH PASSWORD 'new_password';
\q
```

### エラー: `database "streaming_platform" does not exist`

**解決方法**:
```bash
sudo -u postgres psql
CREATE DATABASE streaming_platform OWNER streaming_user;
GRANT ALL PRIVILEGES ON DATABASE streaming_platform TO streaming_user;
\q

# マイグレーション実行
npm run db:migrate
```

### エラー: `relation "events" does not exist`

**原因**: マイグレーションが実行されていない

**解決方法**:
```bash
cd /path/to/webapp
npm run db:migrate
```

## 🔒 セキュリティ推奨事項

1. **強力なパスワードを使用**
   - 最低16文字以上
   - 大文字、小文字、数字、記号を含む

2. **環境変数ファイルを保護**
   ```bash
   chmod 600 .env.local
   ```

3. **本番環境では環境変数を使用**
   - Vercel: プロジェクト設定 > Environment Variables
   - AWS EC2: systemd環境変数またはAWS Secrets Manager

4. **PostgreSQLのリモートアクセスを制限**
   - 必要な場合のみ外部接続を許可
   - ファイアウォールで5432ポートを制限

## 📊 データベーススキーマ

主要テーブル：
- **artists**: アーティスト情報
- **events**: イベント情報
- **tickets**: チケット情報
- **purchases**: 購入履歴
- **admins**: 管理者アカウント（将来追加予定）

詳細なスキーマは `prisma/migrations/` ディレクトリを参照してください。

## 🚀 デプロイ後の確認

```bash
# アプリケーション起動
npm run build
npm start

# または PM2使用
pm2 start npm --name "streaming-app" -- start
pm2 logs streaming-app

# データベース接続確認
curl http://localhost:3000/api/health

# 管理画面アクセス
# ブラウザで http://your-domain.com/admin
```

## 📝 参考リンク

- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Next.js環境変数](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
