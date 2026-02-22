# 🔧 管理画面エラー対応ガイド

## POST リクエストで 500 エラーが発生する場合

### エラーの確認方法

#### 1. ブラウザのコンソールでエラー確認

**手順**:
1. ブラウザで `F12` を押して開発者ツールを開く
2. `Console` タブを開く
3. 「新規追加」ボタンをクリック
4. エラーメッセージを確認

**よくあるエラー**:
```
POST http://18.178.182.252/api/admin/artists 500 (Internal Server Error)
```

#### 2. EC2サーバーログでエラー詳細を確認

```bash
# SSH接続
ssh -i your-key.pem ec2-user@your-ec2-ip

# PM2を使用している場合
pm2 logs streaming-app --lines 100

# または直接ログを確認
tail -f /path/to/your/log/file.log
```

**確認すべき情報**:
- `POST /api/admin/artists - Request body:` - リクエスト内容
- `POST /api/admin/artists - Error details:` - エラー詳細
- `Database query error:` - データベースエラー

---

## 🔍 エラーパターンと解決方法

### パターン 1: データベース接続エラー

**ログに表示されるエラー**:
```
Database query error: {
  error: "connect ECONNREFUSED",
  code: "ECONNREFUSED"
}
```

**原因**: RDSに接続できていない

**解決方法**:

#### Step 1: DATABASE_URLを確認
```bash
cd /path/to/webapp
cat .env.local | grep DATABASE_URL
```

正しい形式か確認：
```
DATABASE_URL=postgresql://ユーザー名:パスワード@RDSエンドポイント:5432/streaming_platform
```

#### Step 2: RDS接続テスト
```bash
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U your_user \
     -d streaming_platform \
     -c "SELECT 1;"
```

接続できない場合は [RDS_SETUP.md](./RDS_SETUP.md) のトラブルシューティングを参照。

#### Step 3: アプリ再起動
```bash
pm2 restart streaming-app
pm2 logs streaming-app
```

---

### パターン 2: テーブルが存在しない

**ログに表示されるエラー**:
```
Database query error: {
  error: 'relation "artists" does not exist',
  code: "42P01"
}
```

**原因**: マイグレーションが実行されていない

**解決方法**:

```bash
cd /path/to/webapp

# マイグレーション実行
npm run db:migrate

# テーブル確認
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U your_user \
     -d streaming_platform \
     -c "\dt"

# 期待される出力：
# artists, events, tickets, purchases などのテーブル
```

---

### パターン 3: 必須フィールドエラー

**ログに表示されるエラー**:
```
POST /api/admin/artists - Missing required fields: { name: undefined, slug: undefined }
```

**原因**: フロントエンドから必須データが送信されていない

**解決方法**:

#### ブラウザのネットワークタブで確認
1. `F12` → `Network` タブ
2. 「新規追加」ボタンをクリック
3. `admin/artists` のリクエストを選択
4. `Payload` タブで送信データを確認

#### 正しいデータ形式:

**アーティスト**:
```json
{
  "name": "アーティスト名",
  "slug": "artist-slug",
  "bio": "プロフィール（任意）",
  "imageUrl": "画像URL（任意）"
}
```

**イベント**:
```json
{
  "artistId": 1,
  "title": "イベントタイトル",
  "slug": "event-slug",
  "description": "説明（任意）",
  "thumbnailUrl": "サムネイルURL（任意）",
  "streamUrl": "配信URL（任意）",
  "archiveUrl": "アーカイブURL（任意）",
  "status": "upcoming",
  "startTime": "2026-03-01T19:00:00Z",
  "endTime": "2026-03-01T21:00:00Z"
}
```

**チケット**:
```json
{
  "eventId": 1,
  "name": "チケット名",
  "description": "説明（任意）",
  "price": 300000,  // 注：円単位ではなくセント単位（3000円 = 300000）
  "currency": "jpy",
  "stock": 100,
  "isActive": true
}
```

---

### パターン 4: 重複エラー

**ログに表示されるエラー**:
```
Database query error: {
  error: "duplicate key value violates unique constraint",
  code: "23505"
}
```

**原因**: 同じslugが既に存在する

**解決方法**:

#### 別のslugを使用
- `artist-name` → `artist-name-2`
- `event-title` → `event-title-new`

#### 既存データを確認
```bash
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U your_user \
     -d streaming_platform \
     -c "SELECT id, name, slug FROM artists;"
```

---

### パターン 5: 認証エラー

**ログに表示されるエラー**:
```
POST /api/admin/artists 401 (Unauthorized)
```

**原因**: 認証トークンが無効または期限切れ

**解決方法**:

1. **再ログイン**
   - 管理画面からログアウト
   - ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
   - 再度ログイン

2. **セッションストレージをクリア**
   - `F12` → `Application` タブ
   - `Session Storage` → ドメインを選択
   - `admin_credentials` を削除

---

## 🛠️ 詳細デバッグ手順

### 1. ヘルスチェックAPI確認

```bash
curl http://localhost:3000/api/health
```

**期待される出力**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T...",
  "database": "connected",
  "environment": "production"
}
```

`"database": "disconnected"` の場合は、DATABASE_URLとRDS接続を確認。

### 2. 直接SQLでテスト

```bash
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U your_user \
     -d streaming_platform

-- アーティスト挿入テスト
INSERT INTO artists (name, slug, bio, image_url)
VALUES ('テストアーティスト', 'test-artist', 'テスト', NULL)
RETURNING *;

-- 確認
SELECT * FROM artists;

-- 削除（テストデータ）
DELETE FROM artists WHERE slug = 'test-artist';
```

### 3. PM2ログをリアルタイム監視

```bash
pm2 logs streaming-app --lines 0
```

管理画面で「新規追加」を実行し、ログを確認。

---

## 📋 チェックリスト

### データベース接続
- [ ] `.env.local` に `DATABASE_URL` が設定されている
- [ ] RDSエンドポイント、ユーザー名、パスワードが正しい
- [ ] EC2からRDSに接続できる（`psql`で確認）
- [ ] RDSセキュリティグループでEC2からのアクセスが許可されている

### マイグレーション
- [ ] `npm run db:migrate` を実行した
- [ ] テーブルが作成されている（`\dt`で確認）

### アプリケーション
- [ ] 最新コードを取得（`git pull origin main`）
- [ ] 依存関係をインストール（`npm install`）
- [ ] ビルドを実行（`npm run build`）
- [ ] アプリが起動している（`pm2 status`または`ps aux | grep node`）

### 管理画面
- [ ] ブラウザキャッシュをクリア
- [ ] 管理画面にログインできる
- [ ] ダッシュボードが表示される

---

## 🚨 緊急対応

### すべてをリセットして再起動

```bash
# EC2にSSH接続
cd /path/to/webapp

# 最新コードを取得
git pull origin main

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# .env.local確認
cat .env.local

# DATABASE_URLが正しいか確認！

# マイグレーション再実行
npm run db:migrate

# ビルド
npm run build

# PM2再起動
pm2 delete streaming-app
pm2 start npm --name "streaming-app" -- start
pm2 logs streaming-app

# ヘルスチェック
curl http://localhost:3000/api/health
```

---

## 📞 サポート情報

### 有用なコマンド

```bash
# PM2ステータス
pm2 status

# ログ確認
pm2 logs streaming-app --lines 100

# アプリ再起動
pm2 restart streaming-app

# PM2削除して再作成
pm2 delete streaming-app
pm2 start npm --name "streaming-app" -- start

# RDS接続テスト
psql -h your-rds.rds.amazonaws.com -U your_user -d streaming_platform

# ポート確認
netstat -tuln | grep 3000
```

### ログの場所

- **PM2ログ**: `~/.pm2/logs/`
- **Next.jsログ**: コンソール出力（PM2経由）
- **RDSログ**: AWS Console → RDS → your-instance → Logs

---

**関連ドキュメント**:
- [RDS_SETUP.md](./RDS_SETUP.md) - RDS接続設定
- [QUICK_START_RDS.md](./QUICK_START_RDS.md) - クイックスタート
- [README.md](./README.md) - 全体ドキュメント
