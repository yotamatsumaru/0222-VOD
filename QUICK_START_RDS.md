# 🚀 クイックスタート: EC2 + RDS 構成

## 前提条件

- ✅ EC2インスタンスが起動している
- ✅ RDSインスタンスが起動している
- ✅ EC2からRDSへのアクセスが許可されている（セキュリティグループ設定済み）
- ✅ RDSのエンドポイント、ユーザー名、パスワードが分かっている

## ⚡ 5ステップで起動

### Step 1: GitHubから最新コードを取得

```bash
# EC2にSSH接続後
cd /path/to/webapp
git pull origin main
```

### Step 2: 環境変数ファイルを作成

```bash
# .env.local を作成
nano .env.local
```

以下の内容を貼り付け（**実際の値に置き換えてください**）：

```bash
# RDS接続情報（重要！）
DATABASE_URL=postgresql://あなたのユーザー名:あなたのパスワード@あなたのRDSエンドポイント:5432/streaming_platform

# 例：
# DATABASE_URL=postgresql://postgres:MyPassword123@my-rds.abc123.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe（本番環境の場合はsk_live_を使用）
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# JWT認証シークレット（32文字以上のランダムな文字列）
JWT_SECRET=your_random_jwt_secret_at_least_32_chars

# 管理画面認証
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# アプリケーションURL（本番ドメイン）
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**保存**: `Ctrl + O` → `Enter` → `Ctrl + X`

### Step 3: RDS接続テスト

```bash
# psqlがインストールされていない場合
sudo yum install postgresql15 -y  # Amazon Linux
# または
sudo apt-get install postgresql-client -y  # Ubuntu

# RDS接続テスト
psql -h あなたのRDSエンドポイント \
     -U あなたのユーザー名 \
     -d streaming_platform \
     -c "SELECT 1;"

# パスワードを入力
# "1" が表示されれば成功！
```

### Step 4: データベースマイグレーション

```bash
cd /path/to/webapp

# 依存関係インストール（初回のみ）
npm install

# マイグレーション実行
npm run db:migrate

# サンプルデータ投入（オプション）
npm run db:seed
```

### Step 5: アプリケーション起動

```bash
# ビルド
npm run build

# 起動（PM2使用の場合）
pm2 start npm --name "streaming-app" -- start
pm2 save
pm2 startup

# または直接起動
npm start
```

## ✅ 動作確認

### 1. ヘルスチェック

```bash
# DB接続確認
curl http://localhost:3000/api/health

# 期待される出力：
# {
#   "status": "ok",
#   "timestamp": "2026-02-22T...",
#   "database": "connected",
#   "environment": "production"
# }
```

### 2. 管理画面にアクセス

ブラウザで以下を開く：
- `http://あなたのEC2のパブリックIP/admin`
- または `https://your-domain.com/admin`

**ログイン情報**:
- ユーザー名: `admin`
- パスワード: `.env.local` の `ADMIN_PASSWORD`

### 3. 管理画面で動作確認

- ✅ ダッシュボードが表示される
- ✅ イベント一覧が表示される（空の場合もOK）
- ✅ アーティスト一覧が表示される
- ✅ チケット一覧が表示される
- ✅ 「新規追加」ボタンでデータを作成できる

## 🔧 トラブルシューティング

### エラー: `database: "disconnected"` （ヘルスチェック）

**原因**: RDSに接続できていない

**チェック項目**:
```bash
# 1. DATABASE_URLが正しいか確認
cat .env.local | grep DATABASE_URL

# 2. RDSセキュリティグループ確認（AWS Console）
# インバウンドルール: PostgreSQL (5432) <- EC2のセキュリティグループ

# 3. RDSエンドポイントにpingできるか
ping -c 3 あなたのRDSエンドポイント

# 4. psqlで直接接続テスト
psql -h あなたのRDSエンドポイント -U あなたのユーザー名 -d streaming_platform
```

### エラー: 管理画面で500エラー

**原因**: マイグレーション未実行

**解決方法**:
```bash
cd /path/to/webapp
npm run db:migrate
pm2 restart streaming-app
```

### エラー: `relation "events" does not exist`

**原因**: テーブルが作成されていない

**解決方法**:
```bash
# マイグレーション実行
npm run db:migrate

# テーブル確認
psql -h あなたのRDSエンドポイント -U あなたのユーザー名 -d streaming_platform -c "\dt"
```

## 📊 PM2管理コマンド

```bash
# ログ確認
pm2 logs streaming-app

# ステータス確認
pm2 status

# 再起動
pm2 restart streaming-app

# 停止
pm2 stop streaming-app

# 削除
pm2 delete streaming-app
```

## 🔐 セキュリティチェックリスト

- [ ] `.env.local` のパーミッションを制限 (`chmod 600 .env.local`)
- [ ] `ADMIN_PASSWORD` を強力なパスワードに変更
- [ ] `JWT_SECRET` を32文字以上のランダムな文字列に変更
- [ ] RDSは**パブリックアクセス不可**に設定
- [ ] EC2のセキュリティグループで不要なポートを閉じる
- [ ] 本番環境ではStripeのテストキーを`sk_live_`に変更

## 📝 完了！

これでEC2 + RDS構成のNext.jsアプリケーションが起動しました！

**管理画面URL**: `https://your-domain.com/admin`

---

**詳細なドキュメント**: 
- [RDS_SETUP.md](./RDS_SETUP.md) - RDS詳細設定
- [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) - AWS全体のデプロイガイド
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - ローカルDB設定
