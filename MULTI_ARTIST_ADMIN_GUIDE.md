# Artist Admin複数アーティスト担当機能 - デプロイガイド

## 📋 概要

Artist Adminが複数のアーティストを担当できるよう拡張しました。従来は1人の管理者が1アーティストのみ管理可能でしたが、これにより1人の管理者が複数のアーティストを管理できます。

## 🎯 変更内容

### データベース変更
- **新テーブル**: `admin_artists`（多対多関係テーブル）
- **新ビュー**: `admin_with_artists`（複数アーティスト情報を含む）
- **新関数**: 
  - `admin_can_manage_artist(admin_id, artist_id)` - 権限チェック
  - `get_admin_artist_ids(admin_id)` - 管理可能なアーティストIDの配列取得

### アプリケーション変更
- JWT Payloadに`artistIds`, `artistNames`配列追加（後方互換性維持）
- 認証時に担当アーティスト情報を取得
- フィルタリングロジックを複数ID対応
- 管理画面で複数アーティストのイベント・チケット・購入を表示

## 🚀 EC2デプロイ手順

### 1. SSH接続とコード取得

```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main
```

### 2. マイグレーション実行

```bash
psql "postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform" \
  -f prisma/migrations/0005_admin_multiple_artists.sql
```

**期待される出力:**
```
ALTER TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
INSERT 0 X  (既存admin_artistsの数)
DROP VIEW
CREATE VIEW
CREATE FUNCTION
CREATE FUNCTION
COMMENT
COMMENT
```

### 3. マイグレーション確認

```bash
# テーブル作成確認
psql "postgresql://..." -c "\d admin_artists"

# 既存データ移行確認
psql "postgresql://..." -c "SELECT admin_id, artist_id FROM admin_artists;"

# ビュー確認
psql "postgresql://..." -c "SELECT id, username, artist_ids, artist_names FROM admin_with_artists WHERE role = 'artist_admin';"
```

### 4. ビルドと再起動

```bash
cd /home/ec2-user/webapp

# ビルド
npm run build

# 再起動
pm2 restart webapp --update-env

# ログ確認
pm2 logs webapp --lines 50
```

## 🔧 Artist Adminに複数アーティストを割り当てる方法

### 方法1: SQL直接実行（推奨）

```bash
# 例: admin_id=1のArtist Adminにartist_id=2とartist_id=3を追加
psql "postgresql://..." -c "
INSERT INTO admin_artists (admin_id, artist_id) VALUES
  (1, 2),
  (1, 3)
ON CONFLICT (admin_id, artist_id) DO NOTHING;
"

# 確認
psql "postgresql://..." -c "
SELECT 
  a.username,
  ARRAY_AGG(ar.name) as artists
FROM admins a
JOIN admin_artists aa ON a.id = aa.admin_id
JOIN artists ar ON aa.artist_id = ar.id
WHERE a.id = 1
GROUP BY a.id, a.username;
"
```

### 方法2: 便利関数を使用

```bash
# 管理者が特定のアーティストを管理できるか確認
psql "postgresql://..." -c "SELECT admin_can_manage_artist(1, 2);"

# 管理者が管理できるアーティストID一覧取得
psql "postgresql://..." -c "SELECT get_admin_artist_ids(1);"
```

## 📊 データ構造

### admin_artistsテーブル

| カラム | 型 | 説明 |
|---|---|---|
| id | SERIAL | 主キー |
| admin_id | INTEGER | 管理者ID (外部キー) |
| artist_id | INTEGER | アーティストID (外部キー) |
| created_at | TIMESTAMP | 作成日時 |

**制約**: `UNIQUE(admin_id, artist_id)` - 同じ組み合わせの重複防止

### admin_with_artists ビュー

```sql
SELECT 
    a.id,
    a.username,
    a.email,
    a.role,
    a.is_active,
    ARRAY_AGG(aa.artist_id) as artist_ids,  -- 配列で返す
    ARRAY_AGG(ar.name) as artist_names,      -- 配列で返す
    a.created_at,
    a.updated_at
FROM admins a
LEFT JOIN admin_artists aa ON a.id = aa.admin_id
LEFT JOIN artists ar ON aa.artist_id = ar.id
WHERE a.is_active = true
GROUP BY a.id;
```

## 🧪 動作確認

### 1. データベース確認

```bash
# Artist Adminの担当アーティスト一覧
psql "postgresql://..." -c "
SELECT 
  a.id,
  a.username,
  ARRAY_AGG(aa.artist_id) as artist_ids,
  ARRAY_AGG(ar.name) as artist_names
FROM admins a
LEFT JOIN admin_artists aa ON a.id = aa.admin_id
LEFT JOIN artists ar ON aa.artist_id = ar.id
WHERE a.role = 'artist_admin'
GROUP BY a.id, a.username;
"
```

### 2. ログイン確認

1. http://18.178.182.252/admin にアクセス
2. Artist Adminでログイン
3. ブラウザ開発者ツール（F12）→ Application → Local Storage → `admin_token` を確認
4. jwt.io で トークンをデコード → `artistIds`, `artistNames`配列を確認

### 3. 管理画面確認

- **イベント管理**: 複数アーティストのイベントが表示される
- **チケット管理**: 複数アーティストのチケットが表示される
- **購入履歴**: 複数アーティストの購入が表示される

## 📝 使用例

### シナリオ: マネージャーが3人のアーティストを管理

```bash
# 1. マネージャー用のArtist Adminを作成（Super Adminで実行）
# 管理画面またはAPI経由で作成

# 2. 担当アーティストを追加
psql "postgresql://..." -c "
-- 既存のartist_idエントリを削除（重複回避）
DELETE FROM admin_artists WHERE admin_id = 5;

-- 新しく3人のアーティストを割り当て
INSERT INTO admin_artists (admin_id, artist_id) VALUES
  (5, 1),  -- アーティストA
  (5, 2),  -- アーティストB
  (5, 3)   -- アーティストC
ON CONFLICT DO NOTHING;
"

# 3. 確認
psql "postgresql://..." -c "
SELECT 
  username,
  ARRAY_AGG(ar.name ORDER BY ar.id) as managed_artists
FROM admins a
JOIN admin_artists aa ON a.id = aa.admin_id
JOIN artists ar ON aa.artist_id = ar.id
WHERE a.id = 5
GROUP BY a.username;
"
```

## ⚠️ 重要事項

### 後方互換性

- `admins.artist_id`カラムは残っている（非推奨だが削除していない）
- 古いコードとの互換性のため、`artistId`（単数形）も引き続きJWTに含まれる
- 新規コードは`artistIds`（複数形）を使用すること

### データ整合性

既存のArtist Adminは自動的に`admin_artists`テーブルに移行されます：
```sql
INSERT INTO admin_artists (admin_id, artist_id)
SELECT id, artist_id
FROM admins
WHERE artist_id IS NOT NULL AND role = 'artist_admin';
```

### 権限チェック

```typescript
// 古い方法（単一アーティスト）
if (adminInfo.admin.artistId === targetArtistId) { ... }

// 新しい方法（複数アーティスト）
const artistIds = adminInfo.admin.artistIds || [];
if (artistIds.includes(targetArtistId)) { ... }
```

## 🐛 トラブルシューティング

### マイグレーションエラー

**エラー**: `relation "admin_artists" already exists`

**解決**: テーブルが既に存在する場合、マイグレーションをスキップ

```bash
psql "postgresql://..." -c "\d admin_artists"
# テーブルが存在すれば OK
```

### ログイン後に古い担当アーティストしか表示されない

**原因**: トークンがキャッシュされている

**解決**:
1. ログアウト
2. ブラウザキャッシュクリア（Ctrl+Shift+Del）
3. 再ログイン

### アーティスト追加後、イベントが表示されない

**原因**: 既存のadmins.artist_idと重複している

**解決**:
```bash
# 既存のartist_idをNULLに設定（推奨しない、後方互換性のため）
psql "postgresql://..." -c "UPDATE admins SET artist_id = NULL WHERE id = X;"

# または、admin_artistsテーブルで管理
psql "postgresql://..." -c "
SELECT admin_id, artist_id FROM admin_artists WHERE admin_id = X;
"
```

## 📚 関連ファイル

- `prisma/migrations/0005_admin_multiple_artists.sql` - マイグレーションSQL
- `lib/adminAuthNew.ts` - 認証ロジック（複数アーティスト対応）
- `lib/types.ts` - 型定義更新
- `components/admin/EventsManager.tsx` - イベント管理（複数フィルタ）
- `components/admin/TicketsManager.tsx` - チケット管理（複数フィルタ）
- `components/admin/PurchasesView.tsx` - 購入履歴（複数フィルタ）
- `app/admin/page.tsx` - 管理画面メイン

## 🔗 リポジトリ

https://github.com/yotamatsumaru/0222-VOD  
**最新コミット**: `102c476`

---

**作成日**: 2026-03-01
