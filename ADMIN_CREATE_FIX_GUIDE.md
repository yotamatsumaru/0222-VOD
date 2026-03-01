# Artist Admin作成時の複数アーティスト選択機能修正ガイド

## 修正日
2026-03-01

## 問題点

### エラーメッセージ
```
作成エラー: Only artist_admin can be created through this API
```

### 原因
1. **API側**: `/api/admin/admins/create` が単一 `artistId` (number) のみ受け入れ
2. **フロントエンド**: `AdminsManager` が単一アーティストのドロップダウンのみ実装
3. **データ構造**: 複数アーティスト対応のため `admin_artists` テーブルが追加されたが、作成APIが対応していなかった

## 修正内容

### 1. API修正（`app/api/admin/admins/create/route.ts`）

#### Before:
```typescript
const { username, password, email, role, artistId } = body;

if (!artistId) {
  return NextResponse.json(
    { error: 'Artist ID is required for artist_admin' },
    { status: 400 }
  );
}

// 単一 artist_id のみ登録
const admin = await insert(
  `INSERT INTO admins (username, password_hash, email, role, artist_id, is_active)
   VALUES ($1, $2, $3, $4, $5, true)
   RETURNING ...`,
  [username, password_hash, email || null, role, artistId]
);
```

#### After:
```typescript
const { username, password, email, role, artist_ids } = body;

// 複数アーティストID配列の検証
if (!artist_ids || !Array.isArray(artist_ids) || artist_ids.length === 0) {
  return NextResponse.json(
    { error: 'At least one artist ID is required for artist_admin (artist_ids must be an array)' },
    { status: 400 }
  );
}

// adminsテーブルに挿入（artist_idはNULL、後方互換性のため保持）
const admin = await insert(
  `INSERT INTO admins (username, password_hash, email, role, artist_id, is_active)
   VALUES ($1, $2, $3, $4, NULL, true)
   RETURNING id, username, email, role, artist_id, is_active, created_at, updated_at`,
  [username, password_hash, email || null, role]
);

// admin_artists テーブルに複数アーティストを登録
for (const artistId of artist_ids) {
  await insert(
    `INSERT INTO admin_artists (admin_id, artist_id, created_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [admin.id, artistId]
  );
}

// admin_with_artists ビューから完全な情報を取得
const fullAdmin = await getOne(
  `SELECT id, username, email, role, artist_id, is_active, created_at, updated_at,
          artist_ids, artist_names
   FROM admin_with_artists
   WHERE id = $1`,
  [admin.id]
);

return NextResponse.json(fullAdmin || admin, { status: 201 });
```

### 2. フロントエンド修正（`components/admin/AdminsManager.tsx`）

#### 2.1 リクエストボディの変更

**Before:**
```typescript
body: JSON.stringify({
  username: formData.username,
  password: formData.password,
  email: formData.email || null,
  role: formData.role,
  artist_id: formData.artist_id ? parseInt(formData.artist_id) : null // 単一ID
})
```

**After:**
```typescript
// バリデーション追加
if (formData.role === 'artist_admin' && formData.artist_ids.length === 0) {
  alert('アーティストを少なくとも1つ選択してください');
  return;
}

body: JSON.stringify({
  username: formData.username,
  password: formData.password,
  email: formData.email || null,
  role: formData.role,
  artist_ids: formData.artist_ids // 複数ID配列
})
```

#### 2.2 フォームUIの変更（単一選択 → 複数選択チェックボックス）

**Before（ドロップダウン）:**
```tsx
{formData.role === 'artist_admin' && (
  <div>
    <label>担当アーティスト</label>
    <select
      value={formData.artist_id}
      onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
      required
    >
      <option value="">選択してください</option>
      {artists.map((artist) => (
        <option key={artist.id} value={artist.id}>
          {artist.name}
        </option>
      ))}
    </select>
  </div>
)}
```

**After（チェックボックス）:**
```tsx
{formData.role === 'artist_admin' && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      担当アーティスト（複数選択可）
    </label>
    <div className="max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-3 space-y-2">
      {artists.length === 0 ? (
        <p className="text-gray-400 text-sm">アーティストが登録されていません</p>
      ) : (
        artists.map((artist) => (
          <label key={artist.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
            <input
              type="checkbox"
              checked={formData.artist_ids.includes(artist.id)}
              onChange={(e) => {
                const newArtistIds = e.target.checked
                  ? [...formData.artist_ids, artist.id]
                  : formData.artist_ids.filter(id => id !== artist.id);
                setFormData({ ...formData, artist_ids: newArtistIds });
              }}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white text-sm">{artist.name}</span>
          </label>
        ))
      )}
    </div>
    {formData.artist_ids.length > 0 && (
      <p className="text-xs text-gray-400 mt-2">
        選択中: {formData.artist_ids.length}人のアーティスト
      </p>
    )}
  </div>
)}
```

#### 2.3 Admin一覧表示の改善

**Before:**
```tsx
<td className="py-3 px-4 text-white">
  {admin.artist_name || '-'}
</td>
```

**After（複数アーティスト名を表示）:**
```tsx
<td className="py-3 px-4 text-white">
  {admin.role === 'super_admin' 
    ? '-' 
    : (admin.artist_names && admin.artist_names.length > 0
        ? admin.artist_names.join(', ')
        : admin.artist_name || '-')
  }
</td>
```

## 動作確認

### テスト手順

1. **Super Adminでログイン**
   ```
   URL: http://18.178.182.252/admin
   Username: admin
   Password: （.env.local の SUPER_ADMIN_PASSWORD）
   ```

2. **管理者管理タブへ移動**
   - 左メニューの「管理者管理」をクリック

3. **新規Artist Admin作成**
   - 「新規作成」ボタンをクリック
   - フォーム入力:
     - ユーザー名: `artist_admin_test`
     - パスワード: `test1234`
     - メールアドレス: `test@example.com` (任意)
     - 権限: `Artist Admin` (デフォルト)
     - **担当アーティスト**: 複数のアーティストにチェック（例: Artist A, Artist B）
   - 「作成」をクリック
   - ✅ **成功確認**: 「管理者を作成しました」とアラート表示

4. **Admin一覧で確認**
   - ✅ 新規作成したAdminが一覧に表示される
   - ✅ 「アーティスト」列に複数アーティスト名がカンマ区切りで表示（例: `Artist A, Artist B`）

5. **作成したAdminでログイン（オプション）**
   - ログアウトして、作成した `artist_admin_test` でログイン
   - ダッシュボードで統計を確認
   - イベント管理タブで選択した複数アーティストのイベントが全て表示されることを確認

## データベース構造

### admins テーブル
```sql
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'super_admin' | 'artist_admin'
  artist_id INTEGER, -- 後方互換性（非推奨、NULLで保存）
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### admin_artists テーブル（中間テーブル）
```sql
CREATE TABLE admin_artists (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_id, artist_id)
);
```

### admin_with_artists ビュー
```sql
CREATE VIEW admin_with_artists AS
SELECT 
  a.id,
  a.username,
  a.password_hash,
  a.role,
  a.artist_id, -- 後方互換性
  a.email,
  a.is_active,
  a.created_at,
  a.updated_at,
  ARRAY_AGG(aa.artist_id) FILTER (WHERE aa.artist_id IS NOT NULL) as artist_ids,
  ARRAY_AGG(ar.name) FILTER (WHERE ar.name IS NOT NULL) as artist_names
FROM admins a
LEFT JOIN admin_artists aa ON a.id = aa.admin_id
LEFT JOIN artists ar ON aa.artist_id = ar.id
GROUP BY a.id, a.username, a.password_hash, a.role, a.artist_id, a.email, a.is_active, a.created_at, a.updated_at;
```

## 作成フロー

```
1. ユーザーがフォームで複数アーティストを選択
   ↓
2. フロントエンドがバリデーション（最低1人選択）
   ↓
3. POST /api/admin/admins/create
   Body: {
     username: "artist_admin_test",
     password: "test1234",
     email: "test@example.com",
     role: "artist_admin",
     artist_ids: [1, 2, 3] // 複数ID配列
   }
   ↓
4. API側の処理:
   a. ユーザー名重複チェック
   b. パスワードをbcryptでハッシュ化
   c. adminsテーブルにINSERT（artist_id = NULL）
      → 新規admin.id = 10 が返る
   d. admin_artistsテーブルにループでINSERT:
      - INSERT (admin_id=10, artist_id=1)
      - INSERT (admin_id=10, artist_id=2)
      - INSERT (admin_id=10, artist_id=3)
   e. admin_with_artistsビューから完全な情報を取得
      → { id: 10, username: "artist_admin_test", artist_ids: [1,2,3], artist_names: ["Artist A", "Artist B", "Artist C"] }
   ↓
5. フロントエンドが結果を受け取り、一覧を再取得
   ↓
6. 一覧に新規Adminが表示（複数アーティスト名がカンマ区切りで表示）
```

## EC2 デプロイ手順

```bash
# SSH接続
ssh ec2-user@18.178.182.252

# ワーキングディレクトリ
cd /home/ec2-user/webapp

# 最新コードをプル
git pull origin main

# ビルド
npm run build

# PM2でアプリを再起動
pm2 restart webapp --update-env

# ログ確認
pm2 logs webapp --lines 50
```

## トラブルシューティング

### 問題1: 「Only artist_admin can be created through this API」
- **原因**: `role: 'super_admin'` を指定している
- **解決**: Super Adminは `.env.local` で設定済み。UIでは `Artist Admin` のみ作成可能

### 問題2: 「At least one artist ID is required...」
- **原因**: アーティストが1人も選択されていない
- **解決**: 少なくとも1人のアーティストにチェックを入れる

### 問題3: 「アーティストが登録されていません」
- **原因**: `artists` テーブルが空
- **解決**: 先に「アーティスト管理」タブでアーティストを作成する

### 問題4: 作成後もアーティスト名が「-」と表示される
- **原因**: `admin_with_artists` ビューのキャッシュ
- **解決**: ページをリロードするか、ログアウト→ログインする

## 関連ファイル

- `app/api/admin/admins/create/route.ts` - Admin作成API（複数アーティスト対応）
- `components/admin/AdminsManager.tsx` - Admin管理UI（複数選択チェックボックス）
- `prisma/migrations/0005_admin_multiple_artists.sql` - マイグレーション（admin_artistsテーブル作成）
- `lib/adminAuthNew.ts` - JWT認証ヘルパー（artistIds配列対応）

## 最新コミット

```
0068d9d - feat: Artist Admin作成時に複数アーティスト選択可能に
636dde3 - docs: アーティスト削除・作成時の統計表示バグ修正ガイド追加
e1b4253 - fix: アーティスト管理のJWT認証対応と統計再取得機能の実装
```

## リポジトリ

https://github.com/yotamatsumaru/0222-VOD  
ブランチ: `main`  
最新コミット: `0068d9d`

---

**修正完了**: Artist Admin作成時に複数アーティストを選択できるようになりました。チェックボックスUIで直感的に操作可能です。
