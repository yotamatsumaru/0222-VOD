# RDS（AWS）データベースセットアップガイド

## 🗄️ 構成

```
┌─────────────┐         ┌─────────────┐
│   EC2       │         │     RDS     │
│  (Next.js)  │ ──────> │ (PostgreSQL)│
└─────────────┘         └─────────────┘
```

- **EC2**: Next.jsアプリケーションサーバー
- **RDS**: PostgreSQLデータベース（マネージド）

## ⚙️ セットアップ手順

### 1. RDSエンドポイント情報の取得

AWS コンソールから RDS の接続情報を確認：

- **エンドポイント**: `your-db-instance.xxxxx.ap-northeast-1.rds.amazonaws.com`
- **ポート**: `5432`（デフォルト）
- **データベース名**: `streaming_platform`
- **マスターユーザー名**: `postgres` または作成したユーザー名
- **パスワード**: RDS作成時に設定したパスワード

### 2. EC2のセキュリティグループ設定

RDSに接続できるように、セキュリティグループを設定：

1. **RDSのセキュリティグループ**に移動
2. **インバウンドルール**を編集
3. 以下のルールを追加：
   - **タイプ**: PostgreSQL
   - **プロトコル**: TCP
   - **ポート範囲**: 5432
   - **ソース**: EC2のセキュリティグループID または EC2のプライベートIP

### 3. 環境変数の設定（EC2上）

EC2インスタンスの `/path/to/webapp/.env.local` を編集：

```bash
# RDS接続情報
DATABASE_URL=postgresql://マスターユーザー名:パスワード@RDSエンドポイント:5432/streaming_platform

# 例：
# DATABASE_URL=postgresql://postgres:MySecurePassword123@my-rds-instance.abc123.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
```

**完全な `.env.local` の例**:

```bash
# Database (RDS)
DATABASE_URL=postgresql://postgres:YourPassword@your-rds.abc123.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# JWT Secret (32文字以上のランダムな文字列)
JWT_SECRET=your_random_jwt_secret_at_least_32_characters_long

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# CloudFront (Optional)
CLOUDFRONT_PRIVATE_KEY=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_DOMAIN=

# App URL (本番ドメイン)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. RDS接続テスト

EC2から RDS に接続できるか確認：

```bash
# psql がインストールされていない場合
sudo yum install postgresql15  # Amazon Linux 2023
# または
sudo apt-get install postgresql-client  # Ubuntu/Debian

# RDS接続テスト
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "SELECT 1;"
```

### 5. データベースマイグレーション

```bash
cd /path/to/webapp

# マイグレーション実行
npm run db:migrate

# サンプルデータ投入（オプション）
npm run db:seed
```

### 6. アプリケーションの再起動

```bash
# PM2を使用している場合
pm2 restart streaming-app
pm2 logs streaming-app

# または直接実行
npm run build
npm start
```

## 🔍 トラブルシューティング

### エラー: `ECONNREFUSED`

**原因**: RDSに接続できない

**チェックリスト**:
1. ✅ RDSのセキュリティグループでEC2からのアクセスが許可されているか
2. ✅ DATABASE_URLのエンドポイントが正しいか
3. ✅ RDSインスタンスが起動しているか（AWS Console確認）
4. ✅ EC2とRDSが同じVPC内にあるか

**解決方法**:
```bash
# セキュリティグループを確認
# AWS Console > RDS > your-instance > Connectivity & security > Security

# RDS接続テスト
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d streaming_platform

# 環境変数確認
cat .env.local | grep DATABASE_URL
```

### エラー: `password authentication failed`

**原因**: パスワードが間違っている

**解決方法**:
```bash
# AWS Console > RDS > your-instance > Modify
# マスターパスワードを変更

# .env.local を更新
nano .env.local
# DATABASE_URL のパスワード部分を新しいパスワードに変更

# アプリ再起動
pm2 restart streaming-app
```

### エラー: `database "streaming_platform" does not exist`

**原因**: データベースが作成されていない

**解決方法**:
```bash
# RDSに接続
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d postgres

# データベース作成
CREATE DATABASE streaming_platform;
\q

# マイグレーション実行
npm run db:migrate
```

### エラー: `timeout`

**原因**: ネットワーク接続の問題

**チェックリスト**:
1. ✅ EC2のアウトバウンドルールでポート5432が許可されているか
2. ✅ RDSのエンドポイントが正しいか
3. ✅ VPCのルートテーブルが正しく設定されているか

### 管理画面でデータが表示されない

**原因**: マイグレーションまたはシードデータ未実行

**解決方法**:
```bash
cd /path/to/webapp

# テーブルが存在するか確認
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d streaming_platform -c "\dt"

# テーブルがない場合、マイグレーション実行
npm run db:migrate

# データがない場合、シードデータ投入
npm run db:seed
```

## 🔒 セキュリティベストプラクティス

### 1. RDSを Public にしない

- RDSは**プライベートサブネット**に配置
- EC2からのみアクセス可能にする
- インターネットからの直接アクセスを禁止

### 2. 強力なパスワードを使用

```bash
# 強力なパスワード生成例
openssl rand -base64 32
```

### 3. IAM認証を使用（推奨）

RDSでIAM認証を有効化すると、パスワード不要で接続可能：

```bash
# IAM認証用の接続文字列（将来の実装）
# DATABASE_URL=postgresql://iamuser@your-rds.rds.amazonaws.com:5432/streaming_platform?sslmode=require
```

### 4. SSL接続を強制

```bash
# SSL接続を使用
DATABASE_URL=postgresql://user:pass@your-rds.rds.amazonaws.com:5432/streaming_platform?sslmode=require
```

### 5. 環境変数ファイルの保護

```bash
# .env.local のパーミッション設定
chmod 600 .env.local

# root以外読めないようにする
sudo chown root:root .env.local
sudo chmod 400 .env.local
```

## 📊 RDS監視

### CloudWatch メトリクス

- **CPUUtilization**: CPU使用率
- **DatabaseConnections**: アクティブな接続数
- **FreeStorageSpace**: 空きストレージ容量
- **ReadLatency / WriteLatency**: レイテンシー

### ログ確認

```bash
# EC2のアプリログ
pm2 logs streaming-app

# RDSログはAWS Consoleから確認
# RDS > your-instance > Logs & events
```

## 🚀 パフォーマンス最適化

### 接続プーリング

現在の実装（`lib/db.ts`）はpg.Poolを使用して接続プーリングを実装済み：

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // 最大接続数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### インデックス最適化

頻繁に検索されるカラムにインデックスを追加：

```sql
-- イベントのスラッグ検索を高速化
CREATE INDEX idx_events_slug ON events(slug);

-- アーティストのスラッグ検索を高速化
CREATE INDEX idx_artists_slug ON artists(slug);

-- 購入履歴のメールアドレス検索を高速化
CREATE INDEX idx_purchases_customer_email ON purchases(customer_email);
```

## 📝 デプロイチェックリスト

- [ ] RDSインスタンスが起動している
- [ ] EC2のセキュリティグループでRDSへのアクセスが許可されている
- [ ] `.env.local` にRDSエンドポイントが正しく設定されている
- [ ] マイグレーションが実行されている（`npm run db:migrate`）
- [ ] シードデータが投入されている（`npm run db:seed`）
- [ ] RDS接続テストが成功している
- [ ] アプリケーションが起動している（PM2またはnpm start）
- [ ] 管理画面にログインできる
- [ ] 管理画面でデータの作成・編集・削除ができる

## 🔗 関連ドキュメント

- [AWS RDS PostgreSQL ドキュメント](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Next.js 環境変数](https://nextjs.org/docs/basic-features/environment-variables)
- [Node.js pg ドキュメント](https://node-postgres.com/)

---

**最終更新**: 2026-02-22
