# EC2デプロイメント手順 - ユーザー認証機能付き

最終更新: 2026-02-23

## 📋 概要

本ドキュメントは、ユーザー認証機能（登録・ログイン）とマイページ機能が実装されたストリーミングプラットフォームをEC2にデプロイする手順です。

## 🚀 EC2でのデプロイ手順

### 1. SSHでEC2に接続

```bash
ssh ec2-user@18.178.182.252
```

### 2. 最新コードの取得

```bash
cd /home/ec2-user/webapp
git pull origin main
```

### 3. 環境変数の更新

`.env.local`ファイルに以下を設定してください：

```bash
# データベース接続（RDSエンドポイント）
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe API キー（テストモード）
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# JWT認証シークレット（本番環境では必ず変更）
JWT_SECRET=development_jwt_secret_minimum_32_characters_required_for_production

# 管理画面ログイン情報
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://18.178.182.252

# CloudFront設定（オプション）
CLOUDFRONT_PRIVATE_KEY=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_DOMAIN=
```

**重要**: `YOUR_RDS_PASSWORD` を実際のRDSパスワードに置き換えてください。

### 4. データベースマイグレーション

新しいマイグレーション（ユーザーテーブル、購入履歴へのuser_id追加）を適用します：

```bash
cd /home/ec2-user/webapp
node scripts/migrate.js
```

出力例：
```
Applying migration: 0001_initial_schema.sql
...
Applying migration: 0002_add_users_auth.sql
Created users table
Applying migration: 0003_add_user_id_to_purchases
Added user_id to purchases table
All migrations completed successfully
```

### 5. 依存関係のインストール

```bash
npm install
```

### 6. プロダクションビルド

```bash
npm run build
```

ビルド成功時の出力例：
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
Route (app)                              Size
┌ ○ /                                   123 kB
├ ○ /events                              98 kB
├ ○ /login                               87 kB
├ ○ /register                            87 kB
└ ○ /mypage                              102 kB
```

### 7. PM2でアプリケーションを再起動

```bash
pm2 restart webapp
```

### 8. デプロイ確認

#### ログ確認
```bash
pm2 logs webapp --lines 30
```

正常起動時の出力例：
```
0|webapp   | ▲ Next.js 14.2.20
0|webapp   | - Local: http://localhost:3000
0|webapp   | - Network: http://0.0.0.0:3000
0|webapp   | ✓ Ready in 1234ms
```

#### ヘルスチェック
```bash
curl http://localhost:3000/api/health
```

期待される出力：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

## ✅ 動作確認チェックリスト

### フロントエンド機能

1. **トップページ**: http://18.178.182.252/
   - [ ] 紫グラデーション背景が表示される
   - [ ] イベント一覧が表示される

2. **ユーザー登録**: http://18.178.182.252/register
   - [ ] 新規ユーザー登録ができる
   - [ ] 登録後、自動ログインしてトップページへリダイレクト

3. **ログイン**: http://18.178.182.252/login
   - [ ] ログインできる
   - [ ] ナビゲーションバーにユーザー名が表示される

4. **イベント詳細**: http://18.178.182.252/events/[slug]
   - [ ] イベント情報が表示される
   - [ ] チケット購入ボタンが表示される

5. **チケット購入フロー**:
   - [ ] 未ログイン状態で「購入する」をクリック → ログインページへリダイレクト
   - [ ] ログイン後、「購入する」をクリック → Stripe Checkoutへ遷移
   - [ ] テストカード（4242 4242 4242 4242）で決済
   - [ ] 購入完了後、マイページへリダイレクト

6. **マイページ**: http://18.178.182.252/mypage
   - [ ] 購入履歴が表示される
   - [ ] 各購入の視聴ボタンが表示される（有効期限内の場合）

7. **管理画面**: http://18.178.182.252/admin
   - [ ] Basic認証（admin / admin123）でログイン
   - [ ] ダッシュボードが表示される

### API エンドポイント確認

```bash
# ユーザー登録
curl -X POST http://18.178.182.252/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# ログイン
curl -X POST http://18.178.182.252/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# レスポンス例:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":1,"email":"test@example.com","name":"Test User"}}
```

## 🗄️ データベース確認

```bash
# PostgreSQLに接続
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform

# テーブル確認
\dt

# ユーザー数確認
SELECT COUNT(*) FROM users;

# 購入履歴（user_id付き）確認
SELECT p.id, u.email, e.title, p.amount, p.status
FROM purchases p
JOIN users u ON p.user_id = u.id
JOIN events e ON p.event_id = e.id
ORDER BY p.purchased_at DESC
LIMIT 10;
```

## 🛠️ トラブルシューティング

### 問題1: ログインしても購入できない

**原因**: JWT_SECRETが設定されていない、または短すぎる

**解決策**:
```bash
# .env.localを編集
nano /home/ec2-user/webapp/.env.local

# JWT_SECRETを32文字以上のランダム文字列に変更
JWT_SECRET=your_secure_random_string_at_least_32_characters_long

# PM2再起動
pm2 restart webapp
```

### 問題2: マイページで購入履歴が表示されない

**原因**: マイグレーション0003が適用されていない

**解決策**:
```bash
cd /home/ec2-user/webapp
node scripts/migrate.js

# 手動でuser_idを追加する場合
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id INTEGER;"
```

### 問題3: Stripe決済でエラー

**原因**: STRIPE_SECRET_KEYが未設定または無効

**解決策**:
```bash
# .env.localを確認
cat /home/ec2-user/webapp/.env.local | grep STRIPE

# 正しいキーを設定
nano /home/ec2-user/webapp/.env.local

# PM2再起動
pm2 restart webapp
```

### 問題4: 背景が真っ黒で読めない

**原因**: CSSが正しく適用されていない

**解決策**:
```bash
# キャッシュクリア
rm -rf /home/ec2-user/webapp/.next

# 再ビルド
cd /home/ec2-user/webapp
npm run build
pm2 restart webapp
```

## 📊 PM2管理コマンド

```bash
# アプリケーション一覧
pm2 list

# ログ表示
pm2 logs webapp

# リアルタイムモニタリング
pm2 monit

# 再起動
pm2 restart webapp

# 停止
pm2 stop webapp

# 起動
pm2 start webapp

# 削除
pm2 delete webapp

# 保存（自動起動設定）
pm2 save
pm2 startup
```

## 🔐 セキュリティチェックリスト

- [ ] `.env.local`のパーミッションが適切（600）
- [ ] JWT_SECRETが32文字以上のランダム文字列
- [ ] ADMIN_PASSWORDがデフォルト値から変更されている
- [ ] RDSセキュリティグループでEC2のIPのみ許可
- [ ] Stripe webhookエンドポイントが正しく設定されている
- [ ] HTTPSの設定（将来的にCloudFrontまたはALB + ACM）

## 📚 関連ドキュメント

- `README.md` - プロジェクト概要
- `DOCUMENTATION.md` - 完全なドキュメント
- `EC2_STRIPE_FIX.md` - Stripe認証エラー修正手順
- `完全解決手順_まとめ.md` - 管理画面エラー解決手順

## 🎯 次のステップ

1. **メール通知機能の追加**
   - 購入完了メール
   - 視聴URLの送信
   - パスワードリセット機能

2. **HTTPSの有効化**
   - Let's EncryptまたはACM証明書
   - CloudFront + S3（静的アセット配信）

3. **監視・ログ**
   - CloudWatch Logsの設定
   - エラー通知（SNS）
   - パフォーマンスモニタリング

4. **バックアップ**
   - RDS自動バックアップ
   - スナップショットスケジュール

---

**更新履歴**:
- 2026-02-23: ユーザー認証機能とマイページ追加
- 2026-02-22: 初版作成
