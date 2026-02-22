# EC2 完全クリーンデプロイ手順

## ❌ 問題の原因

管理画面でログイン後に「Application error」が発生する場合、以下が原因です：

1. **古いビルドキャッシュ**: `.next` フォルダに古いJavaScriptファイルが残っている
2. **ブラウザキャッシュ**: ブラウザが古いファイルを使用している
3. **未適用のコード**: 最新のnull安全性修正が適用されていない

## ✅ 完全解決手順（EC2実行）

### ステップ1: PM2プロセスを完全停止

```bash
cd /home/ec2-user/webapp

# PM2プロセスを停止・削除
pm2 stop webapp
pm2 delete webapp
pm2 kill
```

### ステップ2: プロジェクトを完全削除

```bash
# プロジェクトフォルダを完全削除
cd /home/ec2-user
rm -rf webapp
```

### ステップ3: 最新コードをクローン

```bash
# 最新コードをGitHubからクローン
git clone https://github.com/yotamatsumaru/0222-VOD.git webapp
cd webapp

# 最新コミット確認（81c1e22 が表示されるはず）
git log --oneline -1
```

期待出力:
```
81c1e22 fix: 管理画面ページのnull安全性を修正 - toLocaleStringエラーを完全解決
```

### ステップ4: 依存関係をインストール

```bash
npm install
```

### ステップ5: .env.local を作成

```bash
cat > .env.local << 'EOF'
# Database (RDS接続情報)
DATABASE_URL=postgresql://postgres:<RDS_PASSWORD>@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# JWT Secret（32文字以上のランダム文字列）
JWT_SECRET=your_jwt_secret_change_in_production_32_chars_minimum

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# CloudFront (Optional - for DRM)
CLOUDFRONT_PRIVATE_KEY=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_DOMAIN=

# App URL
NEXT_PUBLIC_APP_URL=http://18.178.182.252
EOF
```

⚠️ **重要**: `<RDS_PASSWORD>` と `your_secure_admin_password_here` を実際の値に置き換えてください。

### ステップ6: RDSデータベースを確認・作成

```bash
# RDS接続確認
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "\l"
```

データベース `streaming_platform` が存在しない場合:

```bash
# データベース作成
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "CREATE DATABASE streaming_platform;"
```

### ステップ7: マイグレーション実行

```bash
npm run db:migrate
```

期待出力:
```
Connecting to database...
DATABASE_URL: postgresql://postgres:****@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
Connected successfully!
Running migration...
Migration completed successfully!
```

### ステップ8: サンプルデータ投入（オプション）

```bash
npm run db:seed
```

### ステップ9: プロダクションビルド

```bash
npm run build
```

期待出力:
```
   Generating static pages (0/6)  [    ]
✓ Generating static pages (6/6)
✓ Finalizing page optimization
✓ Collecting build traces

Route (app)                              Size     First Load JS
┌ ○ /                                    10.2 kB        150 kB
├ ○ /admin                               15.3 kB        155 kB
├ ○ /api/health                          0 B              0 B
└ ○ /events/[slug]                       8.5 kB         148 kB

○  (Static)  prerendered as static content
```

### ステップ10: PM2で起動

```bash
# アプリを起動
pm2 start "npx next start -H 0.0.0.0 -p 3000" --name webapp

# PM2プロセスリストを保存（再起動時に自動起動）
pm2 save

# PM2を自動起動設定
pm2 startup
```

### ステップ11: 起動確認

```bash
# ログを確認
pm2 logs webapp --lines 30
```

期待ログ:
```
0|webapp   | ▲ Next.js 16.1.6
0|webapp   | - Local:        http://localhost:3000
0|webapp   | - Network:      http://0.0.0.0:3000
0|webapp   | 
0|webapp   | ✓ Starting...
0|webapp   | ✓ Ready in 582ms
0|webapp   | Database connection established
```

### ステップ12: ヘルスチェック

```bash
curl http://localhost:3000/api/health
```

期待レスポンス:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-22T20:15:00.000Z",
  "environment": "production"
}
```

## 🌐 ブラウザでの確認手順

### 1. シークレットモードで開く

- **Chrome**: Ctrl + Shift + N
- **Firefox**: Ctrl + Shift + P
- **Safari**: Cmd + Shift + N

### 2. 管理画面にアクセス

```
http://18.178.182.252/admin
```

### 3. ログイン

- **ユーザー名**: `admin`
- **パスワード**: `.env.local` の `ADMIN_PASSWORD` で設定した値

### 4. 期待される画面

✅ ダッシュボードが正常に表示される:
- 総売上: ¥0
- 購入数: 0
- イベント数: 10 （seed実行時）
- アーティスト数: 2 （seed実行時）

## 🧪 動作確認テスト

### テスト1: アーティスト追加

1. 「アーティスト管理」タブをクリック
2. 「新規追加」ボタンをクリック
3. 以下を入力:
   - 名前: `テストアーティスト`
   - プロフィール: `これはテストです`
   - 画像URL: （空白でOK）
4. 「作成」ボタンをクリック
5. ✅ 成功: モーダルが閉じて、リストに追加される

### テスト2: イベント追加

1. 「イベント管理」タブをクリック
2. 「新規追加」ボタンをクリック
3. 以下を入力:
   - タイトル: `テストイベント`
   - アーティスト: 作成したアーティストを選択
   - 開始日時: `2026-03-01T19:00`
4. 「作成」ボタンをクリック
5. ✅ 成功: リストに追加される

### テスト3: チケット追加

1. 「チケット管理」タブをクリック
2. 「新規追加」ボタンをクリック
3. 以下を入力:
   - イベント: 作成したイベントを選択
   - チケット名: `一般チケット`
   - 価格: `3000`
   - 在庫数: `100`
4. 「作成」ボタンをクリック
5. ✅ 成功: リストに追加される

## 🔍 トラブルシューティング

### エラー1: `Application error: a client-side exception has occurred`

**原因**: ブラウザキャッシュが古いファイルを使用している

**解決方法**:
1. シークレットモードで開く
2. または完全なキャッシュクリア: Ctrl + Shift + Delete → すべての期間

### エラー2: `Cannot read properties of undefined (reading 'toLocaleString')`

**原因**: 古いビルドが使用されている

**解決方法**:
```bash
cd /home/ec2-user/webapp
pm2 stop webapp
rm -rf .next
npm run build
pm2 start webapp
```

### エラー3: `database "streaming_platform" does not exist`

**原因**: RDSにデータベースが作成されていない

**解決方法**:
```bash
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -c "CREATE DATABASE streaming_platform;"
```

### エラー4: `relation "artists" does not exist`

**原因**: マイグレーションが実行されていない

**解決方法**:
```bash
cd /home/ec2-user/webapp
npm run db:migrate
pm2 restart webapp
```

### エラー5: `self-signed certificate in certificate chain`

**原因**: DATABASE_URLに `?sslmode=require` が含まれている

**解決方法**:
`.env.local` の `DATABASE_URL` から `?sslmode=require` を削除して再起動:
```bash
pm2 restart webapp
```

### エラー6: `connect ECONNREFUSED 127.0.0.1:5432`

**原因**: マイグレーションスクリプトが `.env.local` を読み込んでいない

**解決方法**:
```bash
npm install dotenv
npm run db:migrate
```

## 📊 データベース確認コマンド

### テーブル一覧

```bash
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "\dt"
```

期待出力:
```
             List of relations
 Schema |    Name    | Type  |  Owner   
--------+------------+-------+----------
 public | artists    | table | postgres
 public | events     | table | postgres
 public | purchases  | table | postgres
 public | tickets    | table | postgres
```

### データ件数確認

```bash
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "SELECT 
           (SELECT COUNT(*) FROM artists) as artists,
           (SELECT COUNT(*) FROM events) as events,
           (SELECT COUNT(*) FROM tickets) as tickets,
           (SELECT COUNT(*) FROM purchases) as purchases;"
```

### アーティスト一覧

```bash
psql -h database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com \
     -U postgres \
     -d streaming_platform \
     -c "SELECT id, name, slug FROM artists;"
```

## 🔐 セキュリティ推奨事項

### 1. 環境変数のセキュリティ

```bash
# .env.localのパーミッション設定
chmod 600 .env.local
```

### 2. 強力なパスワード生成

```bash
# JWT_SECRET生成（32文字以上）
openssl rand -base64 48

# ADMIN_PASSWORD生成
openssl rand -base64 24
```

### 3. RDSセキュリティグループ

- EC2のプライベートIPのみ許可
- ポート5432をパブリックに公開しない

## 📝 重要なファイルパス

```
/home/ec2-user/webapp/             # プロジェクトルート
/home/ec2-user/webapp/.env.local   # 環境変数ファイル
/home/ec2-user/webapp/.next/       # ビルドキャッシュ（削除してクリーン）
/home/ec2-user/.pm2/logs/          # PM2ログディレクトリ
```

## 🚀 本番環境チェックリスト

- [ ] 最新コード取得（コミット 81c1e22）
- [ ] `.env.local` 設定完了
- [ ] RDSデータベース作成済み
- [ ] マイグレーション実行完了
- [ ] ビルド成功
- [ ] PM2起動成功
- [ ] ヘルスチェック OK
- [ ] 管理画面ログイン成功
- [ ] アーティスト追加テスト成功
- [ ] イベント追加テスト成功
- [ ] チケット追加テスト成功

## 📞 サポート情報

### GitHub リポジトリ
https://github.com/yotamatsumaru/0222-VOD

### 最新コミット
```
81c1e22 - fix: 管理画面ページのnull安全性を修正 - toLocaleStringエラーを完全解決
b8b7714 - fix: マイグレーションスクリプトでdotenvを使用して.env.localを読み込み
f36af70 - fix: RDS SSL証明書エラー対応、接続設定を改善
92ce2aa - fix: ダッシュボードのnull/undefined安全性を改善、エラー時もデフォルト値を表示
```

### 関連ドキュメント
- `DATABASE_SETUP.md` - ローカルPostgreSQL設定
- `RDS_SETUP.md` - AWS RDS設定ガイド
- `QUICK_START_RDS.md` - クイックスタートガイド
- `TROUBLESHOOTING_ADMIN.md` - 管理画面トラブルシューティング
- `AWS_DEPLOYMENT.md` - AWS EC2デプロイガイド

## ✅ 成功の確認方法

すべて完了すると:

1. **PM2ステータス**: `pm2 list` で webapp が `online`
2. **ヘルスチェック**: `curl http://localhost:3000/api/health` が `"database":"connected"`
3. **ブラウザ**: `http://18.178.182.252/admin` でダッシュボード表示
4. **エラーなし**: ブラウザコンソール（F12）にエラーがない
5. **管理機能**: アーティスト・イベント・チケットの追加が成功

---

**最終更新**: 2026-02-22  
**対象環境**: AWS EC2 + RDS PostgreSQL
