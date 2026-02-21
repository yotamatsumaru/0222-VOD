# AWS EC2 + PostgreSQL への移行まとめ

## 📋 移行完了内容

EC2 と PostgreSQL を使った本番運用への移行が完了しました!

### ✅ 完了した作業

1. **PostgreSQL マイグレーションスキーマ作成**
   - SQLite (D1) から PostgreSQL へのスキーマ変換
   - `AUTOINCREMENT` → `SERIAL`
   - `DATETIME` → `TIMESTAMP`
   - `INTEGER` → `INT`/`BIGINT`
   - ファイル: `migrations/postgresql/0001_initial_schema.sql`

2. **データベースクライアントライブラリ実装**
   - PostgreSQL (`pg`) ライブラリの統合
   - Cloudflare D1 互換APIの実装
   - コネクションプール管理
   - ファイル: `src/lib/db.ts`

3. **Node.jsサーバーへの移行**
   - `@hono/node-server` を使用したサーバー実装
   - Cloudflare Workers から Node.js への移行
   - 静的ファイル配信の最適化
   - ファイル: `src/server.ts`

4. **依存関係の更新**
   - Cloudflare関連パッケージの削除
   - PostgreSQL/Node.js関連パッケージの追加
   - ファイル: `package.json`

5. **PM2設定の作成**
   - クラスターモードでの実行
   - 環境変数の読み込み
   - ログ管理とオートリスタート
   - ファイル: `ecosystem.config.cjs`

6. **Nginx設定の作成**
   - リバースプロキシ設定
   - 静的ファイル配信の最適化
   - SSL/TLS対応準備
   - Gzip圧縮とキャッシュ設定
   - ファイル: `nginx.conf`

7. **自動デプロイスクリプト作成**
   - EC2インスタンスのセットアップ自動化
   - 依存関係のインストール
   - アプリケーションの起動
   - ファイル: `deploy-ec2.sh`

8. **包括的なデプロイ手順書**
   - AWS環境のセットアップガイド
   - RDS PostgreSQLの構築手順
   - EC2インスタンスの設定
   - ドメイン設定とSSL証明書の取得
   - 監視とバックアップの設定
   - トラブルシューティングガイド
   - ファイル: `AWS_DEPLOYMENT.md`

9. **環境変数の整備**
   - `.env.example`: 本番環境用テンプレート
   - `.env.local`: ローカル開発用テンプレート

---

## 🚀 次のステップ

### 1. AWS環境の準備

#### RDS PostgreSQL の作成

1. AWS Management Console にログイン
2. RDS → Create database
3. PostgreSQL 15.x を選択
4. インスタンスタイプ: `db.t3.micro` (開発) / `db.t3.small`+ (本番)
5. データベース名: `streaming_platform`
6. マスターユーザー名とパスワードを設定
7. VPC と セキュリティグループを設定

#### EC2 インスタンスの起動

1. EC2 → Launch Instance
2. Ubuntu 22.04 LTS を選択
3. インスタンスタイプ: `t3.micro` (開発) / `t3.small`+ (本番)
4. キーペアの作成または選択
5. セキュリティグループ: HTTP(80), HTTPS(443), SSH(22) を許可

### 2. デプロイの実行

EC2インスタンスにSSH接続し、以下を実行:

```bash
# デプロイスクリプトのダウンロードと実行
wget https://raw.githubusercontent.com/yourusername/streaming-platform/main/deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 3. 環境変数の設定

```bash
sudo nano /home/ubuntu/webapp/.env
```

以下を設定:

```bash
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/streaming_platform
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
PORT=3000
NODE_ENV=production
```

### 4. データベースマイグレーション

```bash
cd /home/ubuntu/webapp
npm run db:migrate
npm run db:seed  # オプション
```

### 5. アプリケーション起動

```bash
pm2 restart streaming-platform
pm2 logs streaming-platform --nostream
```

### 6. ドメイン設定とSSL

```bash
# ドメインのDNS設定 (A レコード → EC2のIP)
# Let's Encrypt SSL証明書の取得
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📚 ドキュメント

- **[AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)**: 包括的なデプロイ手順書
- **[README.md](./README.md)**: プロジェクト概要と機能一覧
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: 旧Cloudflare Pages デプロイ手順

---

## 🛠️ 管理コマンド

### PM2

```bash
pm2 status                      # プロセス一覧
pm2 logs streaming-platform     # ログ表示
pm2 restart streaming-platform  # 再起動
pm2 stop streaming-platform     # 停止
```

### Database

```bash
npm run db:migrate   # マイグレーション実行
npm run db:seed      # シードデータ投入
npm run db:console   # psql接続
```

### Nginx

```bash
sudo nginx -t                  # 設定テスト
sudo systemctl reload nginx    # リロード
sudo systemctl status nginx    # ステータス確認
```

---

## 💡 ローカル開発

ローカルでPostgreSQLを使って開発する場合:

```bash
# PostgreSQLのインストール (Ubuntu)
sudo apt install postgresql postgresql-contrib

# データベース作成
sudo -u postgres createdb streaming_platform

# .env.local の設定
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/streaming_platform

# マイグレーション
npm run db:migrate

# 開発サーバー起動
npm run dev
```

---

## 🔄 アーキテクチャの変更点

### Before (Cloudflare)

```
User → Cloudflare Pages → D1 (SQLite)
                        → Stripe
```

### After (AWS)

```
User → Route 53
    → Nginx (EC2)
    → Node.js + Hono (PM2)
    → RDS PostgreSQL
    → Stripe
```

---

## 📊 コスト見積もり (AWS)

### 開発環境

- EC2 t3.micro: 無料枠 (12ヶ月) / $8.5/月
- RDS db.t3.micro: 無料枠 (12ヶ月) / $15/月
- Elastic IP: 無料 (使用中)
- データ転送: 無料枠 1GB/月

**合計**: 無料枠内 → $0/月 (1年目)

### 本番環境

- EC2 t3.small: $17/月
- RDS db.t3.small: $30/月
- Elastic IP: 無料 (使用中)
- データ転送: 従量課金

**合計**: 約 $50-70/月

---

## ⚠️ 重要な注意事項

1. **セキュリティ**
   - `.env` ファイルは絶対にGitにコミットしない
   - RDSのセキュリティグループは適切に設定
   - SSH キーペアは安全に保管

2. **バックアップ**
   - RDS の自動バックアップを有効化
   - 重要な変更前は手動スナップショット作成

3. **監視**
   - CloudWatch でメトリクスを監視
   - アラームを設定して異常を検知

4. **コスト管理**
   - AWS Cost Explorer で定期的にコスト確認
   - 不要なリソースは削除

---

## 🎉 完了!

これで、Cloudflare Pages + D1 から AWS EC2 + PostgreSQL への移行が完了しました!

質問や問題があれば、以下を確認してください:

- CloudWatch Logs
- PM2 Logs: `pm2 logs streaming-platform`
- Nginx Logs: `/var/log/nginx/streaming-platform-*.log`
- RDS Performance Insights

---

**最終更新**: 2026-02-21
