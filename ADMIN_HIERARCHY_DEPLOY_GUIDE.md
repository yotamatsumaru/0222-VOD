# 階層的管理者システム - デプロイガイド

## 🎯 新しい管理者システムの概要

### 管理者の階層

1. **Super Admin（最高管理者）**
   - .envに設定されたID/パスワードでログイン
   - 全てのリソース（ユーザー、イベント、アーティスト、チケット、管理者）を管理
   - Artist Adminを作成・編集・削除できる

2. **Artist Admin（アーティスト管理者）**
   - サイト内で管理（Super Adminが作成）
   - 自分に紐づいたアーティストのイベントとチケットのみ管理
   - 他のアーティストのデータは閲覧・編集不可

## 📦 データベースマイグレーション

### ステップ1: EC2に接続

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main
```

### ステップ2: マイグレーションSQLを実行

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" \
  -f prisma/migrations/0004_add_admin_roles.sql
```

**期待される出力**:
```
ALTER TABLE
UPDATE 1
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE TRIGGER
CREATE VIEW
COMMENT
COMMENT
COMMENT
COMMENT
COMMENT
```

### ステップ3: マイグレーション結果を確認

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"
```

```sql
-- adminsテーブルの構造を確認
\d admins

-- 期待される出力:
--  id              | integer
--  username        | character varying(255)
--  password_hash   | character varying(255)
--  role            | character varying(20)    ← 新規
--  artist_id       | integer                  ← 新規
--  email           | character varying(255)   ← 新規
--  is_active       | boolean                  ← 新規
--  created_at      | timestamp
--  updated_at      | timestamp                ← 新規

-- 既存の管理者を確認
SELECT id, username, role, artist_id, is_active FROM admins;

-- ビューを確認
SELECT * FROM admin_with_artist;

\q
```

## ⚙️ 環境変数の設定

### .envファイルを編集

```bash
vi /home/ec2-user/webapp/.env.local
```

以下の環境変数を追加または更新：

```bash
# Super Admin（最高管理者）の認証情報
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=your-secure-password-here

# JWT Secret（必須・変更してください）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 既存の設定（そのまま）
ADMIN_USERNAME=admin  # 旧システムとの互換性のために残す
ADMIN_PASSWORD=your-password
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=...
# ... その他の既存設定
```

**⚠️ 重要な注意事項**:
1. `SUPER_ADMIN_PASSWORD` は強力なパスワードに変更してください
2. `JWT_SECRET` は32文字以上のランダムな文字列に変更してください
3. これらの値は絶対に公開しないでください

### JWTシークレットの生成（推奨）

```bash
# ランダムな JWT Secret を生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 アプリケーションのデプロイ

### ステップ1: ビルド

```bash
cd /home/ec2-user/webapp
npm install
npm run build
```

### ステップ2: PM2で再起動

```bash
pm2 restart webapp --update-env
pm2 logs webapp --lines 50
```

### ステップ3: 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# 期待される出力: {"status":"ok"}
```

## 🧪 テスト手順

### 1. Super Adminでログイン

```bash
# ログインAPIをテスト
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-secure-password-here"
  }'
```

**期待される出力**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "super_admin",
  "admin": {
    "id": 0,
    "username": "admin",
    "role": "super_admin"
  }
}
```

### 2. トークンを使って管理者一覧を取得

```bash
# 上記で取得したトークンを使用
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:3000/api/admin/admins \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Artist Adminを作成

まず、管理するアーティストを確認：

```bash
psql "postgresql://..." -c "SELECT id, name, slug FROM artists;"
```

Artist Adminを作成：

```bash
curl -X POST http://localhost:3000/api/admin/admins/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "artist1_admin",
    "password": "secure-password",
    "email": "artist1@example.com",
    "role": "artist_admin",
    "artistId": 1
  }'
```

### 4. Artist Adminでログイン

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "artist1_admin",
    "password": "secure-password"
  }'
```

**期待される出力**:
```json
{
  "success": true,
  "token": "...",
  "role": "artist_admin",
  "admin": {
    "id": 1,
    "username": "artist1_admin",
    "role": "artist_admin",
    "artistId": 1
  }
}
```

## 📋 チェックリスト

### データベース
- [ ] マイグレーションSQL実行完了
- [ ] `admins`テーブルに新しいカラム追加確認
- [ ] 既存の管理者が`super_admin`に更新された
- [ ] ビュー`admin_with_artist`作成確認

### 環境変数
- [ ] `SUPER_ADMIN_USERNAME`設定
- [ ] `SUPER_ADMIN_PASSWORD`設定（強力なパスワード）
- [ ] `JWT_SECRET`設定（32文字以上のランダム文字列）

### アプリケーション
- [ ] `git pull origin main`実行
- [ ] `npm install`実行
- [ ] `npm run build`成功
- [ ] `pm2 restart webapp --update-env`実行
- [ ] ログにエラーなし

### 動作確認
- [ ] Super Adminでログイン成功
- [ ] トークン取得確認
- [ ] 管理者一覧API動作確認
- [ ] Artist Admin作成成功
- [ ] Artist Adminでログイン成功

## 🔐 セキュリティ上の注意事項

### 1. パスワードの強度

**NG例**:
- `admin123`
- `password`
- `12345678`

**OK例**:
- `Xk9$mP2#vL7qR@4wN`
- ランダムに生成された長いパスワード

### 2. JWT Secretの管理

```bash
# ランダムなJWT Secretを生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 出力例: 3f9d7c8a6b1e4f2d8c9a7b3e5f1d2c8a9b7e3f1d2c8a9b7e3f1d2c8a9b7e3f1
```

### 3. .envファイルの保護

```bash
# .envファイルの権限を確認
ls -la /home/ec2-user/webapp/.env.local

# 権限を制限（所有者のみ読み取り可能）
chmod 600 /home/ec2-user/webapp/.env.local
```

### 4. HTTPS通信

本番環境では必ずHTTPS通信を使用してください。
- Cloudflare、AWS ALB、Nginxなどでリバースプロキシ経由でHTTPS化

## 📚 APIエンドポイント一覧

### 認証API

| メソッド | エンドポイント | 説明 | 権限 |
|---------|--------------|------|------|
| POST | `/api/admin/auth/login` | 管理者ログイン | なし |

### 管理者管理API（Super Adminのみ）

| メソッド | エンドポイント | 説明 | 権限 |
|---------|--------------|------|------|
| GET | `/api/admin/admins` | 管理者一覧取得 | Super Admin |
| POST | `/api/admin/admins/create` | Artist Admin作成 | Super Admin |
| PATCH | `/api/admin/admins/[id]` | 管理者更新 | Super Admin |
| DELETE | `/api/admin/admins/[id]` | 管理者削除 | Super Admin |

## 🐛 トラブルシューティング

### マイグレーションエラー

**症状**: マイグレーションSQL実行時にエラー

**解決策**:
```bash
# エラー内容を確認
psql "postgresql://..." -f prisma/migrations/0004_add_admin_roles.sql 2>&1 | tee migration.log

# カラムが既に存在する場合
# マイグレーションファイル内の "ADD COLUMN IF NOT EXISTS" を確認
```

### ログインエラー

**症状**: Super Adminでログインできない

**確認事項**:
1. `.env.local`の`SUPER_ADMIN_USERNAME`と`SUPER_ADMIN_PASSWORD`が正しいか
2. アプリが`.env.local`を読み込んでいるか（`pm2 restart webapp --update-env`）
3. ログを確認：`pm2 logs webapp`

### トークンエラー

**症状**: "Invalid token" エラー

**確認事項**:
1. `JWT_SECRET`が設定されているか
2. トークンの有効期限が切れていないか（7日間有効）
3. Authorizationヘッダーが正しいか（`Bearer <token>`）

## 📞 次のステップ

1. **フロントエンド実装**
   - 管理者ログイン画面
   - 管理者管理画面（Super Admin用）
   - 権限に応じた画面表示切り替え

2. **既存APIの更新**
   - イベント管理API: Artist Adminは自分のアーティストのみ
   - チケット管理API: Artist Adminは自分のアーティストのみ
   - 統計API: Artist Adminは自分のアーティストのみ

3. **テスト**
   - Super Adminの機能テスト
   - Artist Adminの機能テスト
   - 権限制御のテスト

---

**最終更新**: 2026/02/25  
**リポジトリ**: https://github.com/yotamatsumaru/0222-VOD  
**コミット**: `e296cd2`
