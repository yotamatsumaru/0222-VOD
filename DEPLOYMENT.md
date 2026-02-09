# デプロイメント手順書

## 📋 目次

1. [事前準備](#事前準備)
2. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
3. [Cloudflare Pagesへのデプロイ](#cloudflare-pagesへのデプロイ)
4. [Stripe設定](#stripe設定)
5. [AWS配信環境との連携](#aws配信環境との連携)
6. [本番環境の動作確認](#本番環境の動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なアカウント

1. **Cloudflare アカウント**
   - https://dash.cloudflare.com/ でアカウント作成
   - Cloudflare Pages の利用が可能なプラン（無料プランでOK）

2. **Stripe アカウント**
   - https://stripe.com/ でアカウント作成
   - テストモードと本番モードの両方のAPIキーを取得

3. **AWS アカウント** (オプション - 配信環境用)
   - MediaLive, MediaPackage, CloudFront の利用権限
   - CloudFront 署名用のキーペア作成

### 必要なツール

- Node.js 18 以上
- npm または yarn
- Git
- Wrangler CLI (Cloudflare)

```bash
# Wrangler のインストール
npm install -g wrangler

# バージョン確認
wrangler --version
```

---

## ローカル開発環境のセットアップ

### 1. プロジェクトのクローン

```bash
# GitHubからクローン
git clone https://github.com/yourusername/streaming-platform.git
cd streaming-platform

# または、プロジェクトディレクトリに移動
cd /home/user/webapp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.dev.vars` ファイルを作成:

```bash
# .dev.vars.example をコピー
cp .dev.vars.example .dev.vars
```

`.dev.vars` を編集:

```bash
# Stripe Configuration (Test mode)
STRIPE_SECRET_KEY=sk_test_あなたのStripeテストキー
STRIPE_WEBHOOK_SECRET=whsec_あなたのWebhookシークレット

# JWT Secret (ランダムな文字列を生成)
JWT_SECRET=ランダムな32文字以上の文字列

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# CloudFront (オプション - 本番環境で設定)
# CLOUDFRONT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
# CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
```

### 4. データベースのセットアップ

```bash
# マイグレーション実行
npm run db:migrate:local

# サンプルデータ投入
npm run db:seed
```

### 5. ローカルサーバーの起動

```bash
# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# ログ確認
pm2 logs streaming-platform --nostream

# サービスが起動したか確認
curl http://localhost:3000/api/health
```

ブラウザで http://localhost:3000 にアクセスして動作確認。

---

## Cloudflare Pagesへのデプロイ

### 1. Cloudflare にログイン

```bash
wrangler login
```

ブラウザが開き、Cloudflareアカウントでログインを求められます。

### 2. D1 データベースの作成

```bash
# 本番用データベースを作成
wrangler d1 create streaming-platform-production

# 出力されたdatabase_idをコピー
# 例: database_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. wrangler.jsonc の更新

`wrangler.jsonc` の `database_id` を更新:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "streaming-platform",
  "compatibility_date": "2026-02-09",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "streaming-platform-production",
      "database_id": "ここに実際のdatabase_idを貼り付け"
    }
  ]
}
```

### 4. 本番データベースのマイグレーション

```bash
# 本番データベースにマイグレーション実行
npm run db:migrate:prod

# 本番データベースにサンプルデータ投入（オプション）
wrangler d1 execute streaming-platform-production --file=./seed.sql
```

### 5. Cloudflare Pages プロジェクトの作成

```bash
# プロジェクト作成
wrangler pages project create streaming-platform \
  --production-branch main \
  --compatibility-date 2026-02-09
```

### 6. ビルドとデプロイ

```bash
# プロジェクトをビルド
npm run build

# Cloudflare Pages にデプロイ
wrangler pages deploy dist --project-name streaming-platform
```

デプロイ成功後、URLが表示されます:
- Production: `https://streaming-platform.pages.dev`
- または: `https://xxxx.streaming-platform.pages.dev`

### 7. 環境変数の設定（本番環境）

```bash
# Stripe Secret Key
wrangler pages secret put STRIPE_SECRET_KEY --project-name streaming-platform
# プロンプトに本番用のStripe Secret Key (sk_live_...) を入力

# Stripe Webhook Secret
wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name streaming-platform
# プロンプトにWebhook Secret を入力

# JWT Secret
wrangler pages secret put JWT_SECRET --project-name streaming-platform
# プロンプトにランダムな文字列を入力

# Admin Username
wrangler pages secret put ADMIN_USERNAME --project-name streaming-platform
# プロンプトに管理者ユーザー名を入力

# Admin Password
wrangler pages secret put ADMIN_PASSWORD --project-name streaming-platform
# プロンプトに管理者パスワードを入力

# CloudFront Private Key (オプション)
wrangler pages secret put CLOUDFRONT_PRIVATE_KEY --project-name streaming-platform
# CloudFront Key Pair ID (オプション)
wrangler pages secret put CLOUDFRONT_KEY_PAIR_ID --project-name streaming-platform
```

### 8. 環境変数の確認

```bash
# 設定済み環境変数の一覧
wrangler pages secret list --project-name streaming-platform
```

---

## Stripe設定

### 1. Stripe Dashboard での設定

1. https://dashboard.stripe.com/ にログイン
2. **開発者 > API キー** でキーを取得
   - 公開可能キー: `pk_live_...` (フロントエンド用、今回は不使用)
   - シークレットキー: `sk_live_...` (バックエンド用)

### 2. Webhook エンドポイントの設定

1. **開発者 > Webhook** に移動
2. **エンドポイントを追加** をクリック
3. エンドポイントURL: `https://streaming-platform.pages.dev/api/stripe/webhook`
4. イベントを選択:
   - `checkout.session.completed`
   - `charge.refunded`
5. **エンドポイントを追加** をクリック
6. 署名シークレット (`whsec_...`) をコピーして環境変数に設定

### 3. テスト決済

本番環境で以下のテストカード番号を使用してテスト:

- カード番号: `4242 4242 4242 4242`
- 有効期限: 任意の未来の日付
- CVC: 任意の3桁
- 郵便番号: 任意

**注意**: 本番環境で実際の決済をテストする場合は、必ず後で払い戻しを行ってください。

---

## AWS配信環境との連携

### 1. CloudFront ディストリビューション設定

AWS MediaPackage から出力されたエンドポイントを CloudFront に設定済みであることを確認。

### 2. CloudFront 署名用キーペアの作成

1. AWS ルートアカウントでログイン
2. **アカウント > セキュリティ認証情報** に移動
3. **CloudFront キーペア** セクションで新しいキーペアを作成
4. プライベートキー (`pk-XXX.pem`) をダウンロード
5. キーペアID (`APKAXXXXXXXX`) をメモ

### 3. プライベートキーの変換

```bash
# PEM形式のプライベートキーを1行に変換
cat pk-XXX.pem | tr '\n' '\\n' > cloudfront-key-oneline.txt

# 出力された内容をCloudflare環境変数に設定
wrangler pages secret put CLOUDFRONT_PRIVATE_KEY --project-name streaming-platform
# ファイルの内容を貼り付け

wrangler pages secret put CLOUDFRONT_KEY_PAIR_ID --project-name streaming-platform
# キーペアIDを入力
```

### 4. 配信URLの設定

データベースに配信URLを設定:

```sql
-- ローカル開発環境で実行
wrangler d1 execute streaming-platform-production --command="
UPDATE events 
SET stream_url = 'https://xxxx.cloudfront.net/out/v1/manifest.m3u8'
WHERE id = 1;
"

-- アーカイブURLも同様に設定
wrangler d1 execute streaming-platform-production --command="
UPDATE events 
SET archive_url = 'https://xxxx.cloudfront.net/archive/video.m3u8',
    event_type = 'archive'
WHERE id = 2;
"
```

---

## 本番環境の動作確認

### 1. 基本的な動作確認

```bash
# ヘルスチェック
curl https://streaming-platform.pages.dev/api/health

# イベント一覧取得
curl https://streaming-platform.pages.dev/api/events

# アーティスト一覧取得
curl https://streaming-platform.pages.dev/api/artists
```

### 2. 管理画面へのアクセス

1. https://streaming-platform.pages.dev/admin にアクセス
2. 設定した管理者ユーザー名とパスワードでログイン
3. ダッシュボードで統計情報を確認

### 3. チケット購入フロー

1. イベント一覧ページでイベントを選択
2. チケットを選択して購入ボタンをクリック
3. Stripe Checkout ページでテストカードで決済
4. 購入完了ページでアクセストークンを確認
5. 視聴ページで動画が再生されることを確認

### 4. Webhook の動作確認

1. Stripe Dashboard の **開発者 > Webhook** に移動
2. 設定したエンドポイントをクリック
3. **イベントを送信** でテストイベントを送信
4. レスポンスが成功 (200 OK) であることを確認

---

## トラブルシューティング

### デプロイエラー

**エラー**: `Error: No such file or directory: dist`

```bash
# 解決策: ビルドを実行
npm run build
```

**エラー**: `Database binding "DB" not found`

```bash
# 解決策: wrangler.jsonc の database_id を確認
wrangler d1 list
# 正しい database_id を wrangler.jsonc に設定
```

### Stripe Webhook エラー

**エラー**: `Webhook signature verification failed`

```bash
# 解決策: 
# 1. Stripe Dashboard で Webhook シークレットを確認
# 2. 環境変数 STRIPE_WEBHOOK_SECRET を再設定
wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name streaming-platform
```

### 視聴ページでエラー

**エラー**: `Failed to load stream`

```bash
# 解決策:
# 1. データベースの stream_url が正しく設定されているか確認
wrangler d1 execute streaming-platform-production --command="SELECT * FROM events"

# 2. CloudFront の設定を確認
# 3. CLOUDFRONT_PRIVATE_KEY と CLOUDFRONT_KEY_PAIR_ID が正しく設定されているか確認
wrangler pages secret list --project-name streaming-platform
```

### 管理画面にログインできない

```bash
# 解決策: 環境変数を確認
wrangler pages secret list --project-name streaming-platform

# ADMIN_USERNAME と ADMIN_PASSWORD が設定されているか確認
# 設定されていない場合は追加
wrangler pages secret put ADMIN_USERNAME --project-name streaming-platform
wrangler pages secret put ADMIN_PASSWORD --project-name streaming-platform
```

### データベースマイグレーションエラー

```bash
# 解決策: データベースをリセット
# 注意: 本番データが削除されます

# ローカル環境の場合
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
npm run db:seed

# 本番環境の場合 (慎重に!)
# 新しいデータベースを作成して移行することを推奨
```

---

## 継続的デプロイ (CI/CD)

### GitHub Actions での自動デプロイ

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name streaming-platform
```

GitHub リポジトリの **Settings > Secrets** で以下を設定:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン

---

## まとめ

✅ **完了事項**:
1. ローカル開発環境のセットアップ
2. Cloudflare Pages へのデプロイ
3. Stripe 連携設定
4. AWS 配信環境との連携準備
5. 管理画面の設定

✅ **次のステップ**:
1. 実際の配信URLをデータベースに設定
2. 本番環境でのテスト配信
3. カスタムドメインの設定 (オプション)
4. メール通知機能の実装 (将来)
5. ユーザーマイページの実装 (将来)

---

**最終更新**: 2026-02-09
