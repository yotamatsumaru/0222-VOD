# 🚀 EC2デプロイ完全ガイド - 最新版

最終更新: 2026-02-23

## ✅ ビルドエラー修正完了

**問題**: `register/page.tsx`で`useState`を`next`からインポートしていた  
**解決**: `react`からインポートするように修正  
**結果**: ✅ ビルド成功！

---

## 📋 EC2デプロイ手順（簡単バージョン）

### 方法1: 自動デプロイスクリプト使用 🎯 **おすすめ！**

```bash
# SSH接続
ssh ec2-user@18.178.182.252

# プロジェクトディレクトリへ移動
cd /home/ec2-user/webapp

# 最新コードを取得（deploy.shを含む）
git pull origin main

# デプロイスクリプトを実行
./deploy.sh
```

**deploy.sh の内容**:
1. 最新コードを取得（git pull）
2. 依存関係をインストール（npm install）
3. データベースマイグレーション実行
4. プロダクションビルド（npm run build）
5. PM2再起動
6. ヘルスチェック

### 方法2: 手動デプロイ

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp

# 1. 最新コード取得
git pull origin main

# 2. 依存関係インストール
npm install

# 3. データベースマイグレーション
node scripts/migrate.js

# 4. ビルド
npm run build

# 5. PM2再起動
pm2 restart webapp

# 6. ログ確認
pm2 logs webapp --lines 30
```

---

## 🔧 Stripe Webhook設定（必須！）

### ⚠️ Webhook未設定だと以下が動作しません：
- ✗ 購入レコードがデータベースに保存されない
- ✗ アクセストークンが発行されない
- ✗ マイページに購入履歴が表示されない
- ✗ チケット在庫が更新されない

### 設定手順

#### 1. Stripeダッシュボードにアクセス
https://dashboard.stripe.com/test/webhooks

#### 2. 「エンドポイントを追加」をクリック

#### 3. エンドポイントURLを入力
```
http://18.178.182.252/api/stripe/webhook
```

#### 4. イベントを選択
- ✅ `checkout.session.completed` - 決済完了時（必須）
- ✅ `charge.refunded` - 返金時（オプション）

#### 5. 署名シークレットをコピー
エンドポイント作成後、以下のような署名シークレットが表示されます：
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 6. EC2の環境変数に設定

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
nano .env.local
```

以下の行を更新：
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

保存して終了（Ctrl+X → Y → Enter）

#### 7. PM2再起動

```bash
pm2 restart webapp
```

#### 8. 動作確認

実際にテスト決済を行って確認：

```bash
# ログを監視
pm2 logs webapp --lines 100 | grep -i purchase
```

成功時の出力例：
```
0|webapp   | Purchase completed: 1
0|webapp   | Query executed: { sql: 'UPDATE tickets SET sold = sold + 1 ...
```

---

## 🗄️ データベース確認コマンド

```bash
# RDSに接続
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform

# テーブル一覧
\dt

# ユーザー数確認
SELECT COUNT(*) FROM users;

# 購入履歴確認（最新10件）
SELECT 
  p.id,
  u.email,
  u.name,
  e.title as event_title,
  t.name as ticket_name,
  p.amount / 100 as price_jpy,
  p.status,
  p.purchased_at
FROM purchases p
LEFT JOIN users u ON p.user_id = u.id
JOIN events e ON p.event_id = e.id
JOIN tickets t ON p.ticket_id = t.id
ORDER BY p.purchased_at DESC
LIMIT 10;

# 終了
\q
```

---

## 📊 動作確認チェックリスト

### フロントエンド

- [ ] **トップページ**: http://18.178.182.252/
  - 紫グラデーション背景が表示される
  - イベント一覧が表示される

- [ ] **新規登録**: http://18.178.182.252/register
  - ユーザー登録ができる
  - 登録後、自動ログイン

- [ ] **ログイン**: http://18.178.182.252/login
  - ログインできる
  - ナビゲーションにユーザー名表示

- [ ] **購入フロー**:
  1. イベント詳細ページへ移動
  2. 「購入する」ボタンをクリック
  3. 未ログインの場合はログインページへリダイレクト
  4. ログイン後、再度「購入する」でStripe Checkoutへ
  5. テストカード（4242 4242 4242 4242）で決済
  6. 決済完了後、マイページへリダイレクト

- [ ] **マイページ**: http://18.178.182.252/mypage
  - 購入履歴が表示される
  - 視聴ボタンが機能する

- [ ] **管理画面**: http://18.178.182.252/admin
  - Basic認証（admin / admin123）でログイン
  - ダッシュボードが表示される
  - CRUD機能が動作する

### API確認

```bash
# ヘルスチェック
curl http://18.178.182.252/api/health

# 期待される出力:
# {"status":"ok","database":"connected","timestamp":"2026-02-23T..."}
```

---

## 🛠️ トラブルシューティング

### 問題1: ビルドエラー

```bash
# .nextキャッシュをクリア
rm -rf /home/ec2-user/webapp/.next

# 再ビルド
npm run build
```

### 問題2: Webhookが動作しない

```bash
# 環境変数確認
cat /home/ec2-user/webapp/.env.local | grep STRIPE_WEBHOOK_SECRET

# ログを確認
pm2 logs webapp --lines 100 | grep -i webhook
```

### 問題3: データベース接続エラー

```bash
# RDSセキュリティグループを確認
# EC2のプライベートIPからの5432番ポートを許可する必要があります

# 接続テスト
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "SELECT 1;"
```

### 問題4: PM2が起動しない

```bash
# PM2プロセスを削除して再作成
pm2 delete webapp
cd /home/ec2-user/webapp
pm2 start npm --name webapp -- start
pm2 save
```

---

## 📝 PM2便利コマンド

```bash
# アプリケーション一覧
pm2 list

# ログ表示（リアルタイム）
pm2 logs webapp

# ログ表示（最新50行）
pm2 logs webapp --lines 50

# モニタリング
pm2 monit

# 再起動
pm2 restart webapp

# 停止
pm2 stop webapp

# 起動
pm2 start webapp

# プロセス削除
pm2 delete webapp

# 自動起動設定を保存
pm2 save
pm2 startup
```

---

## 🔒 セキュリティチェックリスト

本番環境デプロイ前に必ず確認：

- [ ] `.env.local`のパーミッションが600
- [ ] JWT_SECRETが32文字以上のランダム文字列
- [ ] ADMIN_PASSWORDがデフォルト値から変更されている
- [ ] RDSセキュリティグループでEC2のみ許可
- [ ] Stripe Webhookの署名検証が有効
- [ ] 本番環境ではHTTPSを使用（CloudFront/ALB）

---

## 📚 関連ドキュメント

プロジェクトルートに以下のドキュメントがあります：

- `deploy.sh` - 自動デプロイスクリプト
- `EC2_USER_AUTH_DEPLOYMENT.md` - 詳細なデプロイ手順
- `ユーザー認証機能実装完了報告.md` - 実装内容まとめ
- `DOCUMENTATION.md` - プロジェクト完全ドキュメント
- `README.md` - プロジェクト概要

---

## 🎯 次のステップ

1. **Webhookの設定** ← 必須！
2. **テスト決済で動作確認**
3. **本番データの投入**（イベント、アーティスト、チケット）
4. **ドメイン設定とHTTPS化**（将来的に）

---

## 📞 サポート

質問や問題が発生した場合は、GitHubリポジトリのIssuesまたはこのチャットでお知らせください。

**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD  
**最新コミット**: `826990b` - EC2自動デプロイスクリプトを追加

---

**デプロイ成功を祈っています！** 🚀✨
