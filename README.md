# ライブ配信・ストリーミングプラットフォーム (Next.js 14)

AWS・Stripe・Next.jsを使用したライブ配信・ストリーミング基盤

## 🎯 主な機能

### ✅ 実装済み機能

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

### 🚧 今後の拡張予定

1. **管理画面** - イベント・アーティスト・チケットの管理機能
2. **メール通知** - 購入確認メール、視聴URL送信
3. **ユーザーマイページ** - 購入履歴、チケット管理

## 📁 プロジェクト構造

```
webapp/
├── app/
│   ├── api/
│   │   ├── health/
│   │   ├── events/
│   │   ├── artists/
│   │   ├── stripe/
│   │   ├── watch/
│   │   └── purchases/
│   ├── events/
│   │   └── [slug]/
│   ├── artists/
│   │   └── [slug]/
│   ├── watch/
│   │   └── [slug]/
│   ├── success/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navigation.tsx
│   ├── EventCard.tsx
│   ├── TicketPurchase.tsx
│   ├── WatchPlayer.tsx
│   └── SuccessContent.tsx
├── lib/
│   ├── db.ts
│   ├── stripe.ts
│   ├── auth.ts
│   ├── cloudfront.ts
│   └── types.ts
├── prisma/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql
├── public/
│   └── images/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🗄️ データベース設計

### テーブル構成

1. **artists** - アーティスト情報
2. **events** - イベント（ライブ/アーカイブ）
3. **tickets** - チケット種別
4. **purchases** - 購入履歴
5. **admins** - 管理者アカウント

## 🔌 API エンドポイント

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

## ⚙️ セットアップ手順

### 1. 依存関係のインストール

```bash
cd /home/user/webapp
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成（`.env.example` を参考に）:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# JWT Secret
JWT_SECRET=your_random_jwt_secret_here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# CloudFront (Optional)
CLOUDFRONT_PRIVATE_KEY=your_cloudfront_private_key
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. データベースのセットアップ

```bash
# PostgreSQLデータベースを作成
createdb streaming_platform

# マイグレーション実行
npm run db:migrate

# シードデータ投入
npm run db:seed
```

### 4. 開発サーバーの起動

```bash
# 開発モード
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

サーバーは http://localhost:3000 で起動します。

## 🔐 Stripe 設定

### Webhook の設定

1. Stripe Dashboard で Webhook エンドポイントを追加:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - イベント: `checkout.session.completed`, `charge.refunded`

2. Webhook 署名シークレットを `.env.local` に設定

### テストカード

Stripe テストモードで使用できるカード:

- カード番号: `4242 4242 4242 4242`
- 有効期限: 任意の未来の日付
- CVC: 任意の3桁
- 郵便番号: 任意

## 🎬 使い方

### ユーザーフロー

1. **イベントを探す**: トップページまたはイベント一覧ページでイベントを閲覧
2. **チケット購入**: イベント詳細ページでチケットを選択して購入
3. **決済**: Stripe Checkout で安全に決済
4. **視聴**: 購入完了後、アクセストークンを使って視聴ページにアクセス

### AWS 配信環境との連携

このフロントエンドは、以下のAWS環境と連携することを想定しています:

- **AWS MediaLive**: OBSからのRTMP入力受信
- **AWS MediaPackage**: HLS変換とDRM適用
- **CloudFront**: CDN配信と署名付きURL

データベースの `events` テーブルに配信URLを設定:

```sql
UPDATE events 
SET stream_url = 'https://your-cloudfront-domain.net/out/v1/xxx/index.m3u8'
WHERE id = 1;
```

## 📊 サンプルデータ

初期データとして以下が登録されています:

### アーティスト

1. REIRIE
2. みことね

### イベント

- REIRIE LIVE 2026 シリーズ（12公演）
- みことね - The SOUND of LOVE

### チケット

- 一般チケット: ¥3,000

### 管理者アカウント

- ユーザー名: `admin`
- パスワード: `admin123`

## 🚀 デプロイ

### Vercel へのデプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

環境変数は Vercel Dashboard で設定してください。

### AWS EC2 へのデプロイ

1. PostgreSQL のセットアップ
2. Node.js のインストール
3. プロジェクトのクローンとビルド
4. PM2 または systemd でサービス化
5. Nginx でリバースプロキシ設定

## 🔧 トラブルシューティング

### ビルドエラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### データベースエラー

```bash
# データベースをリセット
dropdb streaming_platform
createdb streaming_platform
npm run db:migrate
npm run db:seed
```

## 📄 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL
- **決済**: Stripe
- **認証**: JWT (jsonwebtoken)
- **動画再生**: HLS.js
- **CDN**: AWS CloudFront
- **配信**: AWS MediaLive / MediaPackage

## 📝 ライセンス

本プロジェクトは開発中のベータ版です。

---

**最終更新**: 2026-02-22
