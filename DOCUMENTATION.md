# ライブ配信・ストリーミングプラットフォーム 完全ドキュメント

AWS・Stripe・Next.jsを使用したライブ配信・ストリーミング基盤の完全ガイドです。

---

## 📑 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [主な機能](#主な機能)
3. [技術スタック](#技術スタック)
4. [クイックスタート](#クイックスタート)
5. [環境構築](#環境構築)
6. [AWS EC2 + RDS デプロイ](#aws-ec2--rds-デプロイ)
7. [管理画面ログインエラー解決](#管理画面ログインエラー解決)
8. [Stripe設定](#stripe設定)
9. [トラブルシューティング](#トラブルシューティング)
10. [API仕様](#api仕様)
11. [データベース設計](#データベース設計)

---

## プロジェクト概要

このプロジェクトは、OBSを起点とした安定したライブ配信・ストリーミング基盤です。

### 🎯 主な機能

#### ✅ 実装済み機能

1. **イベント管理システム**
   - ライブ配信とアーカイブ配信の両対応
   - イベント一覧・詳細表示
   - ステータス管理（upcoming, live, ended, archived）

2. **アーティスト管理**
   - アーティスト専用ページ
   - アーティストごとのイベント一覧
   - プロフィール表示

3. **チケット購入システム**
   - Stripe Checkoutによる安全な決済
   - 複数チケット種別対応
   - 在庫管理機能
   - 購入完了後の自動アクセストークン発行

4. **視聴認証システム**
   - JWT ベースのアクセストークン
   - トークンの有効期限管理
   - 購入確認による視聴権限チェック

5. **HLS 動画プレイヤー**
   - HLS.js による HLS 再生
   - ライブ配信とアーカイブ配信の切り替え
   - レスポンシブデザイン

6. **CloudFront 署名付きURL生成**
   - セキュアな配信URLの生成
   - DRM保護対応の準備

7. **管理画面**
   - Basic認証によるログイン
   - ダッシュボード（売上統計・購入数）
   - イベント管理（CRUD操作、ステータス更新）
   - アーティスト管理（CRUD操作）
   - チケット管理（CRUD操作）
   - 購入履歴確認

### 🚧 今後の拡張予定

1. **メール通知** - 購入確認メール、視聴URL送信
2. **ユーザーマイページ** - 購入履歴、チケット管理

---

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **データベース**: PostgreSQL
- **決済**: Stripe
- **認証**: JWT (jsonwebtoken)
- **動画再生**: HLS.js
- **CDN**: AWS CloudFront
- **配信**: AWS MediaLive / MediaPackage

---

## クイックスタート

### 前提条件

- Node.js 18以上
- PostgreSQL 14以上（またはAWS RDS）
- Stripeアカウント

### ローカル開発環境

```bash
# リポジトリをクローン
git clone https://github.com/yotamatsumaru/0222-VOD.git
cd 0222-VOD

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.localを編集して設定

# データベースを作成
createdb streaming_platform

# マイグレーション実行
npm run db:migrate

# サンプルデータ投入（オプション）
npm run db:seed

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

---

## 環境構築

### 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# JWT Secret（32文字以上のランダム文字列）
JWT_SECRET=your_random_jwt_secret_minimum_32_chars

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# CloudFront (Optional - for DRM)
CLOUDFRONT_PRIVATE_KEY=your_cloudfront_private_key
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### データベースセットアップ

#### ローカルPostgreSQL

```bash
# PostgreSQLデータベースを作成
createdb streaming_platform

# マイグレーション実行
npm run db:migrate

# シードデータ投入
npm run db:seed

# 接続テスト
psql -U postgres -d streaming_platform -c "SELECT 1;"
```

---

## AWS EC2 + RDS デプロイ

### 🚀 完全クリーンデプロイ手順

#### ステップ1: PM2プロセスを完全停止

```bash
cd /home/ec2-user/webapp
pm2 stop webapp
pm2 delete webapp
pm2 kill
```

#### ステップ2: プロジェクトを完全削除

```bash
cd /home/ec2-user
rm -rf webapp
```

#### ステップ3: 最新コードをクローン

```bash
git clone https://github.com/yotamatsumaru/0222-VOD.git webapp
cd webapp
git log --oneline -1
```

#### ステップ4: 依存関係をインストール

```bash
npm install
```

#### ステップ5: .env.local を作成

```bash
cat > .env.local << 'EOF'
# Database (RDS接続情報)
DATABASE_URL=postgresql://postgres:<RDS_PASSWORD>@your-rds-endpoint.rds.amazonaws.com:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# JWT Secret（32文字以上）
JWT_SECRET=your_jwt_secret_minimum_32_characters

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# App URL
NEXT_PUBLIC_APP_URL=http://your-ec2-ip-address
EOF
```

#### ステップ6: RDSデータベースを確認

```bash
# RDS接続テスト
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "\dt"
```

**データベースが存在しない場合**:

```bash
# データベース作成
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "CREATE DATABASE streaming_platform;"

# マイグレーション実行
npm run db:migrate

# サンプルデータ投入（オプション）
npm run db:seed
```

#### ステップ7: プロダクションビルド

```bash
npm run build
```

#### ステップ8: PM2で起動

```bash
# アプリを起動
pm2 start "npx next start -H 0.0.0.0 -p 3000" --name webapp

# プロセスリストを保存
pm2 save

# 自動起動設定
pm2 startup
```

#### ステップ9: 動作確認

```bash
# PM2ステータス確認
pm2 list

# ログ確認
pm2 logs webapp --lines 30

# ヘルスチェック
curl http://localhost:3000/api/health
```

期待されるヘルスチェック結果:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-22T...",
  "environment": "production"
}
```

---

## 管理画面ログインエラー解決

### 🎯 問題: Application error が発生する

**症状**: ログイン後に「Application error: a client-side exception has occurred」が表示される

**原因**:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'toLocaleString')
```

統計データが `undefined` の状態で `.toLocaleString()` を呼び出したために発生。

### ✅ 解決方法

#### 1. シークレットモードで確認

- **Chrome**: Ctrl + Shift + N
- **Firefox**: Ctrl + Shift + P
- **Safari**: Cmd + Shift + N

#### 2. 完全なキャッシュクリア

- Ctrl + Shift + Delete
- 「Cached images and files」を選択
- 「All time」を選択
- Delete

#### 3. EC2で完全再ビルド

```bash
cd /home/ec2-user/webapp

# PM2停止
pm2 stop webapp && pm2 delete webapp

# 最新コード取得
git pull origin main

# キャッシュ削除
rm -rf .next

# ビルド
npm run build

# 起動
pm2 start "npx next start -H 0.0.0.0 -p 3000" --name webapp
pm2 save
```

### 🔍 修正内容（GitHub反映済み）

**app/admin/page.tsx** のnull安全性向上:

```tsx
// 修正前（エラーが発生）
¥{stats.totalSales.toLocaleString()}

// 修正後（null安全）
¥{(stats.totalSales || 0).toLocaleString()}
```

---

## Stripe設定

### Webhook の設定

1. Stripe Dashboard にログイン
2. Developers → Webhooks
3. エンドポイントを追加:
   - **URL**: `https://your-domain.com/api/stripe/webhook`
   - **イベント**: `checkout.session.completed`, `charge.refunded`
4. Webhook 署名シークレットを `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定

### テストカード

Stripe テストモードで使用できるカード:

- **カード番号**: `4242 4242 4242 4242`
- **有効期限**: 任意の未来の日付（例：12/34）
- **CVC**: 任意の3桁（例：123）
- **郵便番号**: 任意（例：100-0001）

### チケット購入フロー

1. イベント詳細ページで「チケットを購入」ボタンをクリック
2. チケットを選択
3. Stripe Checkout で決済
4. 購入完了後、アクセストークンが発行される
5. 視聴ページにアクセスして配信を視聴

---

## トラブルシューティング

### データベースエラー（ECONNREFUSED）

**症状**: 管理画面やAPIで500エラー、`ECONNREFUSED` エラー

**原因**: PostgreSQLデータベースに接続できていない

**解決方法**:

```bash
# PostgreSQL起動確認
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 接続テスト
psql -U streaming_user -d streaming_platform -h localhost -c "SELECT 1;"

# データベースをリセット
dropdb streaming_platform
createdb streaming_platform
npm run db:migrate
npm run db:seed
```

### relation "artists" does not exist

**症状**: SQL エラー `relation "artists" does not exist`

**原因**: マイグレーションが実行されていない

**解決方法**:

```bash
npm run db:migrate
pm2 restart webapp
```

### self-signed certificate エラー

**症状**: RDS接続時に `self-signed certificate in certificate chain`

**原因**: DATABASE_URLに `?sslmode=require` が含まれている

**解決方法**:

`.env.local` の `DATABASE_URL` から `?sslmode=require` を削除:

```bash
DATABASE_URL=postgresql://postgres:password@rds-endpoint.com:5432/streaming_platform
```

再起動:

```bash
pm2 restart webapp
```

### database "streaming_platform" does not exist

**症状**: データベースが見つからない

**解決方法**:

```bash
# データベース作成
psql -h your-rds-endpoint.com \
     -U postgres \
     -d postgres \
     -c "CREATE DATABASE streaming_platform;"

# マイグレーション実行
npm run db:migrate
```

### PM2ログにエラーが続く

**解決方法**:

```bash
# ログを確認
pm2 logs webapp --lines 100

# 完全再起動
pm2 stop webapp
pm2 delete webapp
rm -rf .next
npm run build
pm2 start "npx next start -H 0.0.0.0 -p 3000" --name webapp
pm2 save
```

---

## API仕様

### イベント API

- `GET /api/events` - イベント一覧取得
- `GET /api/events/[slug]` - イベント詳細取得
- `GET /api/events/[slug]/tickets` - チケット一覧取得

### アーティスト API

- `GET /api/artists` - アーティスト一覧取得
- `GET /api/artists/[slug]` - アーティスト詳細取得

### Stripe API

- `POST /api/stripe/checkout` - チェックアウトセッション作成
- `POST /api/stripe/webhook` - Stripe Webhook ハンドラー

### 視聴認証 API

- `POST /api/watch/verify` - アクセストークン検証
- `POST /api/watch/stream-url` - 署名付きURL取得

### 購入情報 API

- `GET /api/purchases/[sessionId]` - 購入詳細取得

### 管理画面 API

> **注意**: すべての管理画面APIはBasic認証が必要です

- `POST /api/admin/auth` - 管理者認証
- `GET /api/admin/stats` - 統計情報取得（総売上、購入数など）
- `GET /api/admin/events` - イベント一覧取得
- `POST /api/admin/events` - イベント作成
- `GET /api/admin/events/[id]` - イベント詳細取得
- `PATCH /api/admin/events/[id]` - イベント更新
- `DELETE /api/admin/events/[id]` - イベント削除
- `GET /api/admin/artists` - アーティスト一覧取得
- `POST /api/admin/artists` - アーティスト作成
- `GET /api/admin/artists/[id]` - アーティスト詳細取得
- `PATCH /api/admin/artists/[id]` - アーティスト更新
- `DELETE /api/admin/artists/[id]` - アーティスト削除
- `GET /api/admin/tickets` - チケット一覧取得
- `POST /api/admin/tickets` - チケット作成
- `GET /api/admin/tickets/[id]` - チケット詳細取得
- `PATCH /api/admin/tickets/[id]` - チケット更新
- `DELETE /api/admin/tickets/[id]` - チケット削除
- `GET /api/admin/purchases` - 購入履歴一覧取得

---

## データベース設計

### テーブル構成

#### artists（アーティスト）

```sql
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### events（イベント）

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  stream_url TEXT,
  archive_url TEXT,
  status VARCHAR(50) DEFAULT 'upcoming',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**status**: `upcoming`, `live`, `ended`, `archived`

#### tickets（チケット）

```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  stock INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### purchases（購入履歴）

```sql
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(50) DEFAULT 'pending',
  access_token TEXT,
  purchased_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**status**: `pending`, `completed`, `failed`, `refunded`

---

## セキュリティ推奨事項

### 環境変数のセキュリティ

```bash
# .env.localのパーミッション設定
chmod 600 .env.local
```

### 強力なパスワード生成

```bash
# JWT_SECRET生成（32文字以上）
openssl rand -base64 48

# ADMIN_PASSWORD生成
openssl rand -base64 24
```

### RDSセキュリティグループ

- EC2のプライベートIPのみ許可
- ポート5432をパブリックに公開しない

---

## 📞 サポート情報

### GitHub リポジトリ

**https://github.com/yotamatsumaru/0222-VOD**

### 最終更新

**2026-02-22**

---

## ライセンス

本プロジェクトは開発中のベータ版です。
