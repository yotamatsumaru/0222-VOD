# AWS EC2 デプロイガイド

このガイドでは、Next.jsアプリケーションをAWS EC2にデプロイする手順を説明します。

## 前提条件

- AWS EC2インスタンス（Ubuntu 20.04 LTS推奨）
- Node.js 18.x以上
- PostgreSQL 14以上
- PM2（プロセス管理）
- Nginx（リバースプロキシ）

## 1. EC2インスタンスの準備

### 1.1 Node.jsのインストール

```bash
# Node.js 18.xをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node --version
npm --version
```

### 1.2 PostgreSQLのインストール

```bash
# PostgreSQLのインストール
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# PostgreSQLの起動
sudo systemctl start postgresql
sudo systemctl enable postgresql

# データベースとユーザーの作成
sudo -u postgres psql

CREATE DATABASE streaming_platform;
CREATE USER streaming_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE streaming_platform TO streaming_user;
\q
```

### 1.3 PM2のインストール

```bash
sudo npm install -g pm2
```

## 2. アプリケーションのデプロイ

### 2.1 リポジトリのクローン

```bash
cd /home/ubuntu
git clone https://github.com/yotamatsumaru/0222-VOD.git
cd 0222-VOD
```

### 2.2 環境変数の設定

```bash
# .env.productionファイルを作成
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://streaming_user:your_secure_password@localhost:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here

# JWT Secret (強力なランダム文字列を生成)
JWT_SECRET=$(openssl rand -base64 32)

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_very_secure_admin_password_here

# CloudFront (Optional)
CLOUDFRONT_PRIVATE_KEY=your_cloudfront_private_key
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net

# App URL (EC2のパブリックIPまたはドメイン)
NEXT_PUBLIC_APP_URL=http://18.178.182.252
EOF

# 環境変数ファイルの権限を設定
chmod 600 .env.production
```

### 2.3 依存関係のインストールとビルド

```bash
# 依存関係をインストール
npm install

# データベースマイグレーション
npm run db:migrate

# シードデータを投入（オプション）
npm run db:seed

# 本番ビルド
npm run build
```

### 2.4 PM2でアプリケーションを起動

```bash
# PM2設定ファイルを作成
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'streaming-platform',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# ログディレクトリを作成
mkdir -p logs

# PM2でアプリケーションを起動
pm2 start ecosystem.config.js

# PM2の自動起動設定
pm2 startup
pm2 save
```

## 3. Nginxのセットアップ

### 3.1 Nginxのインストール

```bash
sudo apt install nginx -y
```

### 3.2 Nginx設定ファイルの作成

```bash
sudo tee /etc/nginx/sites-available/streaming-platform << 'EOF'
server {
    listen 80;
    server_name 18.178.182.252;  # EC2のパブリックIPまたはドメイン

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# 設定を有効化
sudo ln -s /etc/nginx/sites-available/streaming-platform /etc/nginx/sites-enabled/

# デフォルト設定を無効化
sudo rm /etc/nginx/sites-enabled/default

# Nginx設定のテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 4. ファイアウォール設定

```bash
# UFWでポートを開放
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (SSL証明書設定後)
sudo ufw enable
```

## 5. SSL証明書の設定（Let's Encrypt）

ドメインを使用する場合：

```bash
# Certbotのインストール
sudo apt install certbot python3-certbot-nginx -y

# SSL証明書の取得と自動設定
sudo certbot --nginx -d yourdomain.com

# 自動更新のテスト
sudo certbot renew --dry-run
```

## 6. トラブルシューティング

### ログの確認

```bash
# PM2ログ
pm2 logs streaming-platform

# Nginxログ
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# アプリケーションログ
tail -f ~/0222-VOD/logs/combined.log
```

### アプリケーションの再起動

```bash
cd ~/0222-VOD
pm2 restart streaming-platform
```

### データベース接続テスト

```bash
psql -h localhost -U streaming_user -d streaming_platform
```

### 環境変数の確認

```bash
pm2 env 0
```

## 7. セキュリティ設定

### 7.1 PostgreSQLのセキュリティ

```bash
# pg_hba.confを編集
sudo nano /etc/postgresql/14/main/pg_hba.conf

# localhostからの接続のみ許可
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# PostgreSQL再起動
sudo systemctl restart postgresql
```

### 7.2 SSH鍵認証の設定

```bash
# パスワード認証を無効化
sudo nano /etc/ssh/sshd_config

# 以下を設定
PasswordAuthentication no
PubkeyAuthentication yes

# SSH再起動
sudo systemctl restart ssh
```

## 8. 更新とメンテナンス

### アプリケーションの更新

```bash
cd ~/0222-VOD

# 最新コードを取得
git pull origin main

# 依存関係を更新
npm install

# ビルド
npm run build

# データベースマイグレーション（必要に応じて）
npm run db:migrate

# アプリケーションを再起動
pm2 restart streaming-platform
```

### バックアップ

```bash
# データベースバックアップ
pg_dump -U streaming_user streaming_platform > backup_$(date +%Y%m%d).sql

# データベースリストア
psql -U streaming_user streaming_platform < backup_20260222.sql
```

## 9. モニタリング

### PM2モニタリング

```bash
# ステータス確認
pm2 status

# CPU/メモリ使用状況
pm2 monit

# ログのリアルタイム表示
pm2 logs --lines 100
```

## 10. よくあるエラーと対処法

### エラー: "Application error: a client-side exception has occurred"

**原因**: 
- 環境変数が設定されていない
- データベースに接続できない
- sessionStorageの問題

**対処法**:
```bash
# 環境変数を確認
pm2 env 0

# .env.productionファイルを確認
cat .env.production

# アプリケーションを再起動
pm2 restart streaming-platform --update-env
```

### エラー: "ECONNREFUSED"

**原因**: データベース接続エラー

**対処法**:
```bash
# PostgreSQLが起動しているか確認
sudo systemctl status postgresql

# データベース接続テスト
psql -h localhost -U streaming_user -d streaming_platform

# DATABASE_URLを確認
echo $DATABASE_URL
```

## サポート

問題が発生した場合は、以下を確認してください：
- PM2ログ: `pm2 logs`
- Nginxログ: `sudo tail -f /var/log/nginx/error.log`
- ブラウザコンソール: F12キーでデベロッパーツールを開く
