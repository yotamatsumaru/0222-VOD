# EC2でのStripeエラー修正手順

## 🐛 エラー内容

```
POST http://18.178.182.252/api/stripe/checkout 500 (Internal Server Error)
StripeAuthenticationError: statusCode: 401
```

## 原因

EC2の `.env.local` にStripeのAPIキーが設定されていないか、古いキーが残っています。

---

## ✅ 修正手順

### ステップ1: EC2にSSH接続

```bash
ssh ec2-user@18.178.182.252
```

### ステップ2: 最新コードを取得

```bash
cd /home/ec2-user/webapp
git pull origin main
```

### ステップ3: .env.local を更新

```bash
cat > /home/ec2-user/webapp/.env.local << 'EOF'
# Database (RDS接続情報 - 実際のパスワードに置き換え)
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe (提供されたStripeキーを使用してください)
STRIPE_SECRET_KEY=sk_test_51T00gN... (提供済みのキー)
STRIPE_PUBLISHABLE_KEY=pk_test_51T00gN... (提供済みのキー)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51T00gN... (提供済みのキー)

# JWT Secret（32文字以上のランダム文字列 - 変更推奨）
JWT_SECRET=your_jwt_secret_minimum_32_characters_long_random_string_here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# CloudFront (Optional - DRM用、不要なら空白のまま)
CLOUDFRONT_PRIVATE_KEY=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_DOMAIN=

# App URL
NEXT_PUBLIC_APP_URL=http://18.178.182.252
EOF
```

⚠️ **重要**: 以下を実際の値に置き換えてください：
- `YOUR_RDS_PASSWORD` → RDSのパスワード
- `JWT_SECRET` → 32文字以上のランダム文字列
- `ADMIN_PASSWORD` → 管理画面用の安全なパスワード

### ステップ4: 環境変数を確認

```bash
# Stripeキーが正しく設定されているか確認
grep STRIPE_SECRET_KEY /home/ec2-user/webapp/.env.local
```

期待される出力:
```
STRIPE_SECRET_KEY=sk_test_51T00gN... (提供済みの完全なキー)
```

### ステップ5: PM2でアプリを再起動

```bash
cd /home/ec2-user/webapp
pm2 restart webapp
```

### ステップ6: ログを確認

```bash
pm2 logs webapp --lines 50
```

エラーログに `StripeAuthenticationError` が表示されなくなればOKです。

### ステップ7: ブラウザでテスト

1. ブラウザで `http://18.178.182.252/` にアクセス
2. イベント詳細ページに移動
3. 「購入する」ボタンをクリック
4. Stripe Checkoutページが表示されればOK

**テストカード情報**:
- **カード番号**: `4242 4242 4242 4242`
- **有効期限**: 12/34（任意の未来の日付）
- **CVC**: 123（任意の3桁）
- **郵便番号**: 100-0001（任意）

---

## 🔍 トラブルシューティング

### エラー1: まだ401エラーが出る

**原因**: 環境変数が読み込まれていない

**解決方法**:
```bash
# 完全再起動
cd /home/ec2-user/webapp
pm2 stop webapp
pm2 delete webapp
pm2 start "npx next start -H 0.0.0.0 -p 3000" --name webapp
pm2 save
```

### エラー2: DATABASE_URLエラー

**原因**: RDSパスワードが正しくない

**解決方法**:
```bash
# RDS接続テスト
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "SELECT 1;"
```

接続できない場合は、RDSパスワードを確認して `.env.local` を更新。

### エラー3: Stripeキーが無効

**原因**: Stripeのテストキーが期限切れまたは無効

**解決方法**:
1. Stripe Dashboard（https://dashboard.stripe.com/test/apikeys）にログイン
2. 「Developers」→「API keys」
3. 新しいキーを発行して `.env.local` を更新

---

## 🎯 確認事項

すべて完了したら、以下を確認してください：

- [ ] EC2の `.env.local` にStripeキーが正しく設定されている
- [ ] PM2でアプリが再起動されている
- [ ] PM2ログにエラーが表示されない
- [ ] ブラウザで購入ボタンをクリックできる
- [ ] Stripe Checkoutページが表示される
- [ ] テストカードで購入が完了する

---

## 📞 サポート

問題が解決しない場合は、以下の情報を共有してください：

```bash
# PM2ログ
pm2 logs webapp --lines 100

# 環境変数確認（パスワード部分は隠す）
grep -E "STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY" /home/ec2-user/webapp/.env.local

# ヘルスチェック
curl http://localhost:3000/api/health
```

---

**最終更新**: 2026-02-22
