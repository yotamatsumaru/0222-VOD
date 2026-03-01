# Super Admin / Artist Admin 階層管理システム - 完全ガイド

## 📋 システム概要

### 管理者階層
1. **Super Admin（最高管理者）**
   - `.env`で設定したID/パスワードでログイン
   - 全ての機能にアクセス可能
   - Artist Adminの作成・管理が可能
   - 全アーティスト・イベント・チケット・購入履歴を管理

2. **Artist Admin（アーティスト管理者）**
   - サイト内でSuper Adminが作成
   - 特定のアーティストに紐付けられる
   - 自分のアーティストのイベント・チケット・購入履歴のみアクセス可能
   - 他のアーティストのデータは閲覧不可

## 🚀 EC2デプロイ手順

### 1. データベースマイグレーション実行

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp

# 最新コード取得
git pull origin main

# マイグレーション実行
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" \
  -f prisma/migrations/0004_add_admin_roles.sql
```

### 2. 環境変数設定

`.env.local`ファイルに以下を追加：

```bash
nano .env.local
```

```env
# Super Admin認証情報（必須）
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=your-secure-password-change-this

# JWT認証用シークレットキー（必須・最低32文字）
JWT_SECRET=your-jwt-secret-key-at-least-32-characters-change-this

# 既存の設定（そのまま）
DATABASE_URL=postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
...
```

### 3. 依存関係インストールとビルド

```bash
# 依存関係更新（Stripe 20.4.0等）
npm install

# ビルド
npm run build
```

### 4. アプリケーション再起動

```bash
# PM2でアプリ再起動
pm2 restart webapp --update-env

# ログ確認
pm2 logs webapp --lines 50
```

## 🔐 ログイン方法

### Super Adminログイン

1. http://18.178.182.252/admin にアクセス
2. `.env.local`に設定したSuper Adminの認証情報でログイン：
   - ユーザー名: `admin` (または設定した値)
   - パスワード: `.env.local`で設定した値

### Artist Adminログイン

1. Super AdminでログインしAdmin管理画面からArtist Adminを作成
2. http://18.178.182.252/admin にアクセス
3. 作成したArtist Adminの認証情報でログイン

## 📊 管理画面機能

### Super Admin専用機能
- **ダッシュボード**: 全体統計表示
- **イベント管理**: 全イベントの作成・編集・削除
- **アーティスト管理**: アーティストの作成・編集・削除
- **チケット管理**: 全チケットの管理
- **購入履歴**: 全購入履歴の表示
- **管理者管理** ⭐: Artist Adminの作成・編集・削除

### Artist Admin機能
- **ダッシュボード**: 自分のアーティストの統計表示
- **イベント管理**: 自分のアーティストのイベントのみ管理
- **チケット管理**: 自分のアーティストのチケットのみ管理
- **購入履歴**: 自分のアーティストの購入履歴のみ表示

## 🛠️ Artist Admin作成手順（Super Adminのみ）

### UIから作成

1. Super Adminでログイン
2. 「管理者管理」タブをクリック
3. 「+ 新規管理者作成」ボタンをクリック
4. フォーム入力：
   - **ユーザー名**: `artist1_admin` (例)
   - **パスワード**: セキュアなパスワード
   - **メールアドレス**: `artist1@example.com` (任意)
   - **権限**: `Artist Admin`
   - **担当アーティスト**: ドロップダウンから選択
5. 「作成」ボタンをクリック

### APIから作成（cURL例）

```bash
# 1. Super Adminでログインしてトークン取得
TOKEN=$(curl -s -X POST http://18.178.182.252/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' | jq -r '.token')

# 2. Artist Admin作成
curl -X POST http://18.178.182.252/api/admin/admins/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "artist1_admin",
    "password": "secure-password",
    "email": "artist1@example.com",
    "role": "artist_admin",
    "artist_id": 1
  }'
```

## 📁 作成されたファイル

### バックエンド
1. `prisma/migrations/0004_add_admin_roles.sql` - DB階層管理追加
2. `lib/adminAuthNew.ts` - JWT認証・権限管理
3. `app/api/admin/auth/login/route.ts` - ログインAPI
4. `app/api/admin/auth/verify/route.ts` - トークン検証API
5. `app/api/admin/admins/route.ts` - 管理者リスト取得API
6. `app/api/admin/admins/create/route.ts` - 管理者作成API
7. `app/api/admin/admins/[id]/route.ts` - 管理者更新/削除API

### フロントエンド
1. `app/admin/page.tsx` - 管理画面メインページ（JWT認証対応）
2. `components/admin/AdminsManager.tsx` - 管理者管理UI
3. `components/admin/EventsManager.tsx` - イベント管理（artistId フィルタ対応）
4. `components/admin/TicketsManager.tsx` - チケット管理（artistId フィルタ対応）
5. `components/admin/PurchasesView.tsx` - 購入履歴（artistId フィルタ対応）

### データベース
- `admins`テーブルに以下カラム追加：
  - `role` VARCHAR (super_admin / artist_admin)
  - `artist_id` INTEGER (NULL可)
  - `email` VARCHAR (NULL可)
  - `is_active` BOOLEAN
  - `updated_at` TIMESTAMP

- `admin_with_artist` VIEW作成（アーティスト名含むjoin）

## 🧪 動作確認

### 1. Super Adminログインテスト

```bash
curl -X POST http://18.178.182.252/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# 期待するレスポンス:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "role": "super_admin",
#   "admin": { ... }
# }
```

### 2. トークン検証テスト

```bash
TOKEN="上記で取得したトークン"
curl -X GET http://18.178.182.252/api/admin/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 管理者リスト取得テスト

```bash
curl -X GET http://18.178.182.252/api/admin/admins \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ トラブルシューティング

### ログインできない

**原因**: `.env.local`の設定が反映されていない

**解決策**:
```bash
# .env.localファイル確認
cat .env.local | grep SUPER_ADMIN

# アプリ再起動（環境変数を再読み込み）
pm2 restart webapp --update-env
pm2 logs webapp --lines 20
```

### トークンエラー（401 Unauthorized）

**原因**: JWT_SECRETが設定されていない、またはトークンが期限切れ

**解決策**:
```bash
# .env.localにJWT_SECRET追加
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.local

# 再起動
pm2 restart webapp --update-env
```

### Artist Adminが他のアーティストのデータを見られる

**原因**: フィルタリングが正しく動作していない

**解決策**:
1. ブラウザのキャッシュクリア（Ctrl+Shift+R）
2. ログアウト→再ログイン
3. コンソール（F12）でエラー確認

### マイグレーションエラー

**エラー例**: `column "role" already exists`

**解決策**:
```bash
# テーブル構造確認
psql "..." -c "\d admins"

# 既にカラムが存在する場合はマイグレーションスキップ
```

## 🔒 セキュリティベストプラクティス

1. **Super Adminパスワード**
   - 最低12文字以上
   - 英数字+記号の組み合わせ
   - 定期的に変更

2. **JWT_SECRET**
   - 最低32文字以上のランダムな文字列
   - 本番環境では必ず変更
   - 絶対にGitにコミットしない

3. **Artist Adminパスワード**
   - 初回作成時にセキュアなパスワード設定
   - 各Artist Adminに一意のパスワード

4. **トークン有効期限**
   - 現在7日間
   - 必要に応じて`lib/adminAuthNew.ts`で変更可能

## 📝 次のステップ

- [ ] EC2にデプロイ実行
- [ ] Super Adminログイン確認
- [ ] Artist Admin 1件作成テスト
- [ ] Artist Adminでログインしてフィルタリング確認
- [ ] 各管理画面が正常に動作するか確認

## 🔗 関連ドキュメント

- [ADMIN_HIERARCHY_DEPLOY_GUIDE.md](./ADMIN_HIERARCHY_DEPLOY_GUIDE.md) - 初期デプロイガイド
- [FIX_SUMMARY_20260225.md](./FIX_SUMMARY_20260225.md) - 過去の修正履歴

## 📞 サポート

質問や問題が発生した場合は、以下の情報を添えて報告してください：

1. エラーメッセージ（ブラウザコンソールとサーバーログ）
2. 実行したコマンドと結果
3. どのユーザー権限でログインしているか
4. 再現手順

---

**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD  
**最新コミット**: `6f2325e`  
**作成日**: 2026-03-01
