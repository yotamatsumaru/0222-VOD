# アーティスト削除・作成時の統計表示バグ修正ガイド

## 修正日
2026-03-01

## 問題点

### 1. アーティスト削除後も統計数字が残る
- **現象**: アーティストを削除しても、ダッシュボードの「アーティスト数」が更新されない
- **原因1**: `stats` APIが複数アーティスト対応していなかった（`artistId`単数のみ対応）
- **原因2**: アーティスト操作後に統計を再取得する仕組みがなかった
- **原因3**: `ArtistsManager`が古いBasic認証を使用していた

### 2. 新規アーティスト登録ができない
- **現象**: 「新規作成」ボタンをクリックして保存しても作成されない
- **原因1**: `/api/admin/artists/route.ts` のハンドラーシグネチャが`requireAdmin`と不一致
- **原因2**: `ArtistsManager`のフォームモーダルがBasic認証を使用していた

## 修正内容

### 1. Stats API の複数アーティスト対応（`app/api/admin/stats/route.ts`）

**Before:**
```typescript
const artistFilter = adminInfo.isSuperAdmin 
  ? '' 
  : `JOIN events e ON p.event_id = e.id WHERE e.artist_id = ${adminInfo.admin.artistId}`;
```

**After:**
```typescript
// artistIdsが配列の場合は全て含め、単数の場合は配列に変換
const artistIds = adminInfo.admin.artistIds || (adminInfo.admin.artistId ? [adminInfo.admin.artistId] : []);
const artistIdsStr = artistIds.length > 0 ? artistIds.join(',') : '0';

// IN句で複数IDに対応
WHERE e.artist_id IN (${artistIdsStr})

// Artist Adminの場合、担当アーティスト数を返す
const artistsResult = adminInfo.isSuperAdmin
  ? await getOne<{ total_artists: number }>('SELECT COUNT(*) as total_artists FROM artists')
  : { total_artists: artistIds.length };
```

### 2. ArtistsManager のJWT認証移行（`components/admin/ArtistsManager.tsx`）

**Before:**
```typescript
const credentials = getAdminCredentials(); // Basic認証
const response = await fetch('/api/admin/artists', {
  headers: {
    'Authorization': `Basic ${credentials}`
  }
});
```

**After:**
```typescript
const token = localStorage.getItem('admin_token'); // JWT認証
const response = await fetch('/api/admin/artists', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. 統計再取得コールバックの追加

**ArtistsManager にコールバックプロップを追加:**
```typescript
interface ArtistsManagerProps {
  onDataChanged?: () => void; // 統計再取得用
}

export default function ArtistsManager({ onDataChanged }: ArtistsManagerProps = {}) {
  // ...
  
  const handleDelete = async (id: number) => {
    // ...
    if (response.ok) {
      await fetchArtists();
      // 親に通知して統計を再取得
      if (onDataChanged) {
        onDataChanged();
      }
    }
  };
}
```

**AdminPage で統計再取得関数を実装:**
```typescript
const refreshStats = () => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    fetchStats(token);
  }
};

// ArtistsManager にコールバックを渡す
<ArtistsManager onDataChanged={refreshStats} />
```

### 4. API Routes のシグネチャ修正（`app/api/admin/artists/route.ts`）

**Before:**
```typescript
async function getHandler(request: NextRequest) {
  // adminInfo パラメータなし
}

export const GET = requireAdmin(getHandler);
```

**After:**
```typescript
async function getHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  // adminInfo を受け取る
}

export const GET = requireAdmin(getHandler);
```

同様に `postHandler` も修正。

## 動作確認

### テスト手順

1. **Super Adminでログイン**
   ```
   URL: http://18.178.182.252/admin
   Username: admin
   Password: （.env.local の SUPER_ADMIN_PASSWORD）
   ```

2. **ダッシュボードで初期統計を確認**
   - 「アーティスト数」をメモする（例: 3）

3. **アーティスト削除テスト**
   - 「アーティスト管理」タブへ移動
   - 任意のアーティストを削除
   - ✅ **削除確認**: アーティストが一覧から消える
   - 「ダッシュボード」タブへ戻る
   - ✅ **統計更新確認**: 「アーティスト数」が減少（例: 3 → 2）

4. **新規アーティスト作成テスト**
   - 「アーティスト管理」タブへ移動
   - 「新規作成」ボタンをクリック
   - フォーム入力:
     - 名前: `Test Artist`
     - スラッグ: `test-artist`（自動生成）
     - Bio: `テスト用アーティスト`
     - 画像URL: （任意）
   - 「保存」をクリック
   - ✅ **作成確認**: 「アーティストを作成しました」とアラート表示
   - ✅ **一覧表示確認**: 新アーティストが一覧に表示
   - 「ダッシュボード」タブへ戻る
   - ✅ **統計更新確認**: 「アーティスト数」が増加（例: 2 → 3）

5. **Artist Adminで確認（オプション）**
   - Artist Adminアカウントでログイン
   - ダッシュボードの「アーティスト数」が担当アーティスト数（1以上）と一致することを確認

## 技術詳細

### JWT認証フロー

```
1. Login: POST /api/admin/auth/login
   → Response: { token: "eyJ...", admin: {...} }

2. Token保存: localStorage.setItem('admin_token', token)

3. API呼び出し:
   Authorization: Bearer eyJ...
   
4. requireAdmin ミドルウェア:
   - JWTトークン検証
   - adminInfo 抽出（id, username, role, artistIds, artistNames）
   - ハンドラーに adminInfo 渡す
```

### 複数アーティスト対応のSQL例

**Super Admin（全アーティスト）:**
```sql
SELECT COUNT(*) as total_artists FROM artists;
-- Result: 5 (全アーティスト数)
```

**Artist Admin（担当アーティストのみ）:**
```sql
-- JWTペイロードから artistIds = [1, 3, 5]
SELECT COUNT(*) as total_events 
FROM events 
WHERE artist_id IN (1, 3, 5);
-- Result: 12 (担当アーティストのイベント数)
```

## EC2 デプロイ手順

```bash
# SSH接続
ssh ec2-user@18.178.182.252

# ワーキングディレクトリ
cd /home/ec2-user/webapp

# 最新コードをプル
git pull origin main

# ビルド（依存関係は既にインストール済み）
npm run build

# PM2でアプリを再起動
pm2 restart webapp --update-env

# ログ確認
pm2 logs webapp --lines 50
```

## 関連ファイル

- `app/api/admin/stats/route.ts` - 統計API（複数アーティスト対応）
- `app/api/admin/artists/route.ts` - アーティスト管理API（ハンドラーシグネチャ修正）
- `components/admin/ArtistsManager.tsx` - アーティスト管理UI（JWT認証対応）
- `app/admin/page.tsx` - 管理画面トップ（refreshStats実装）
- `lib/adminAuthNew.ts` - JWT認証ヘルパー（requireAdmin）

## 最新コミット

```
e1b4253 - fix: アーティスト管理のJWT認証対応と統計再取得機能の実装
bc61919 - fix: 管理画面API全てのhandlerシグネチャを修正
102c476 - feat: Artist Adminが複数のアーティストを担当可能に
```

## リポジトリ

https://github.com/yotamatsumaru/0222-VOD  
ブランチ: `main`  
最新コミット: `e1b4253`

## 補足

### ブラウザキャッシュのクリア（必要に応じて）

EC2デプロイ後、ブラウザキャッシュが原因で古いJavaScriptが実行される可能性がある場合:

1. **ハードリロード**: `Ctrl + Shift + R` (Windows/Linux) / `Cmd + Shift + R` (Mac)
2. **キャッシュクリア**: ブラウザの開発者ツール（F12） → Application → Clear storage
3. **ログアウト・再ログイン**: 管理画面でログアウトして再度ログイン

### データベース状態確認（トラブルシューティング）

```sql
-- アーティスト数を確認
SELECT COUNT(*) FROM artists;

-- Admin-Artist紐付けを確認
SELECT a.id, a.username, a.role, 
       array_agg(aa.artist_id) as artist_ids
FROM admins a
LEFT JOIN admin_artists aa ON a.id = aa.admin_id
GROUP BY a.id, a.username, a.role;

-- ビューでも確認可能
SELECT * FROM admin_with_artists;
```

---

**修正完了**: アーティスト削除・作成時に統計が即座に更新されるようになりました。
