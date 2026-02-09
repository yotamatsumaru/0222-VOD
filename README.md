# ライブ配信・ストリーミングプラットフォーム

## プロジェクト概要

- **名前**: ライブ配信・ストリーミングプラットフォーム
- **目的**: OBSを起点とした安定したライブ配信・ストリーミング基盤のフロントエンド + 決済システム
- **技術スタック**: Hono + TypeScript + Cloudflare Pages + Cloudflare D1 + Stripe

## 🎯 主な機能

### ✅ 完成済み機能

1. **チケット購入システム**
   - Stripe Checkoutによる安全な決済
   - 複数チケット種別対応（通常、プレミアム等）
   - 在庫管理機能
   - 購入完了後の自動アクセストークン発行

2. **視聴認証システム**
   - JWT ベースのアクセストークン
   - トークンの有効期限管理
   - 購入確認による視聴権限チェック

3. **CloudFront 署名付きURL生成**
   - セキュアな配信URLの生成
   - 署名付きCookieのサポート
   - DRM保護対応の準備

4. **イベント管理**
   - ライブ配信とアーカイブ配信の両対応
   - イベント一覧・詳細表示
   - ステータス管理（upcoming, live, ended, archived）

5. **アーティスト管理**
   - アーティスト専用ページ
   - アーティストごとのイベント一覧
   - プロフィール表示

6. **視聴ページ**
   - Video.js による HLS 再生
   - ライブ配信とアーカイブ配信の切り替え
   - レスポンシブデザイン

### 🚧 未実装機能

1. **管理画面**
   - イベント作成・編集・削除
   - アーティスト管理
   - チケット管理
   - 購入履歴の確認

## 📁 プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx              # メインアプリケーション
│   ├── types/
│   │   └── index.ts           # TypeScript 型定義
│   ├── lib/
│   │   ├── stripe.ts          # Stripe 連携
│   │   ├── auth.ts            # JWT 認証
│   │   ├── cloudfront.ts      # CloudFront 署名
│   │   └── db.ts              # データベースヘルパー
│   └── routes/
│       ├── stripe.ts          # Stripe API ルート
│       ├── events.ts          # イベント API
│       ├── artists.ts         # アーティスト API
│       └── watch.ts           # 視聴認証 API
├── public/
│   └── static/
│       ├── events.js          # イベント一覧 UI
│       ├── event-detail.js    # イベント詳細・購入 UI
│       ├── artists.js         # アーティスト一覧 UI
│       ├── artist-detail.js   # アーティスト詳細 UI
│       ├── watch.js           # 視聴ページ UI
│       └── success.js         # 購入完了ページ UI
├── migrations/
│   └── 0001_initial_schema.sql # データベーススキーマ
├── seed.sql                   # サンプルデータ
├── ecosystem.config.cjs       # PM2 設定
├── wrangler.jsonc             # Cloudflare 設定
└── package.json
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
- `GET /api/events/:slug` - イベント詳細取得
- `GET /api/events/:slug/tickets` - チケット一覧取得

### アーティスト API

- `GET /api/artists` - アーティスト一覧取得
- `GET /api/artists/:slug` - アーティスト詳細取得

### Stripe API

- `POST /api/stripe/checkout` - チェックアウトセッション作成
- `POST /api/stripe/webhook` - Stripe Webhook ハンドラー
- `GET /api/stripe/checkout/:sessionId` - セッション状態確認

### 視聴認証 API

- `POST /api/watch/verify` - アクセストークン検証
- `POST /api/watch/stream-url` - 署名付きURL取得
- `POST /api/watch/stream-cookies` - 署名付きCookie取得

## 🌐 公開 URL

- **開発環境**: https://3000-itoc5ynk8roohlf644w1s-cbeee0f9.sandbox.novita.ai
- **本番環境**: （Cloudflare Pages デプロイ後に更新）

### ページ一覧

- `/` - ホームページ
- `/events` - イベント一覧
- `/events/:slug` - イベント詳細・チケット購入
- `/artists` - アーティスト一覧
- `/artists/:slug` - アーティスト詳細
- `/watch/:eventSlug?token=xxx` - 視聴ページ
- `/success?session_id=xxx` - 購入完了ページ

## ⚙️ セットアップ手順

### 1. 依存関係のインストール

```bash
cd /home/user/webapp
npm install
```

### 2. 環境変数の設定

`.dev.vars` ファイルを作成（`.dev.vars.example` を参考に）:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# JWT Secret
JWT_SECRET=your_random_jwt_secret_here

# CloudFront (Optional)
# CLOUDFRONT_PRIVATE_KEY=...
# CLOUDFRONT_KEY_PAIR_ID=...
```

### 3. データベースのセットアップ

```bash
# マイグレーション実行
npm run db:migrate:local

# シードデータ投入
npm run db:seed
```

### 4. 開発サーバーの起動

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs streaming-platform --nostream
```

## 🔐 Stripe 設定

### Webhook の設定

1. Stripe Dashboard で Webhook エンドポイントを追加:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - イベント: `checkout.session.completed`, `charge.refunded`

2. Webhook 署名シークレットを `.dev.vars` に設定

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

## 📝 開発メモ

### 完了済みタスク

- ✅ プロジェクト構造の設計と初期化
- ✅ Cloudflare D1 データベース設計
- ✅ Stripe 連携 API 実装
- ✅ 認証システム実装（JWT）
- ✅ CloudFront 署名付きURL生成
- ✅ チケット購入 UI
- ✅ 視聴ページ UI
- ✅ アーティストページ UI

### 次のステップ

1. **管理画面の実装** - イベント・アーティスト・チケットの管理機能
2. **メール通知** - 購入確認メール、視聴URL送信
3. **ユーザーマイページ** - 購入履歴、チケット管理
4. **本番デプロイ** - Cloudflare Pages へのデプロイ
5. **AWS環境との統合テスト** - 実際の配信URLでの動作確認

## 🚀 デプロイ

### Cloudflare Pages へのデプロイ

```bash
# ビルド
npm run build

# デプロイ
npm run deploy

# または直接
npx wrangler pages deploy dist --project-name streaming-platform
```

### 環境変数の設定（本番環境）

```bash
# Stripe Secret Key
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name streaming-platform

# Stripe Webhook Secret
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name streaming-platform

# JWT Secret
npx wrangler pages secret put JWT_SECRET --project-name streaming-platform
```

## 📊 サンプルデータ

初期データとして以下が登録されています:

### アーティスト

1. Sample Artist
2. Test Band

### イベント

1. Sample Live Concert 2024 (upcoming)
2. Archive Concert (archived)
3. Test Band Live (upcoming)

### チケット

- 通常チケット: ¥3,000
- プレミアムチケット: ¥5,000
- アーカイブ視聴チケット: ¥2,000
- 早割チケット: ¥2,500

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
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
npm run db:seed
```

### ポート競合

```bash
# ポート3000を解放
npm run clean-port

# または
fuser -k 3000/tcp
```

## 📄 ライセンス

本プロジェクトは開発中のベータ版です。

## 👥 開発者

本プロジェクトは、ライブ配信・ストリーミングサービスのベータ版開発として作成されました。

---

**最終更新**: 2026-02-09
