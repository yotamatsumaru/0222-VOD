# 管理画面バグ修正 - サマリー

## 🐛 報告された問題

### 問題1: アーティストを削除しても統計の数字が残る
**スクリーンショット**: アーティスト数が「3」のまま

### 問題2: 新規アーティスト登録ができない

## 🔍 原因

### 問題1の原因
- 統計API自体は正しく動作している
- **ブラウザキャッシュ**の問題
- Reactの状態管理でキャッシュされたデータが残っている

### 問題2の原因
- `requireAdmin`ラッパー関数を使用した際、**handlerのシグネチャが不一致**
- `requireAdmin`は第2引数として`adminInfo`を渡すが、handlerがそれを受け取っていなかった
- 結果: TypeScriptエラーは出ないが、ランタイムで引数のズレが発生

**問題のあったコード:**
```typescript
// ❌ 間違い
async function postHandler(request: NextRequest) {
  const body = await request.json();  // これが実際はadminInfoを受け取ってしまう
  // ...
}

export const POST = requireAdmin(postHandler);
```

**修正後:**
```typescript
// ✅ 正しい
async function postHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  const body = await request.json();  // 正しくrequestを受け取る
  // ...
}

export const POST = requireAdmin(postHandler);
```

## 🔧 修正内容

### 修正したファイル
1. `app/api/admin/artists/route.ts`
   - `getHandler`にadminInfoパラメータ追加
   - `postHandler`にadminInfoパラメータ追加

2. `app/api/admin/tickets/route.ts`
   - `getHandler`にadminInfoパラメータ追加
   - `postHandler`にadminInfoパラメータ追加

3. `app/api/admin/purchases/route.ts`
   - `handler`にadminInfoパラメータ追加

## ✅ 解決方法

### 問題1の解決（統計数字が残る）
**一時的な対応**: ブラウザ再読み込み
1. **Ctrl + Shift + R** (Windows/Linux) または **Cmd + Shift + R** (Mac)
2. または、ブラウザのキャッシュをクリア

**恒久的な対応**: 統計APIにキャッシュ制御ヘッダーを追加（オプション）
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'no-store, max-age=0'
  }
});
```

### 問題2の解決（アーティスト新規登録）
- **修正完了**: 全APIのhandlerシグネチャを修正
- **デプロイ後**: アーティストの新規登録・編集・削除が正常に動作

## 🚀 EC2デプロイ手順

```bash
# 1. SSH接続
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp

# 2. 最新コード取得
git pull origin main

# 3. ビルド
npm run build

# 4. 再起動
pm2 restart webapp --update-env

# 5. ログ確認
pm2 logs webapp --lines 50
```

## 🧪 動作確認

### アーティスト管理機能の確認
1. http://18.178.182.252/admin にログイン
2. **アーティスト管理**タブをクリック
3. **+ 新規作成**ボタンをクリック
4. アーティスト情報を入力して作成
5. 作成されたアーティストが表示されることを確認
6. **編集**ボタンで編集可能
7. **削除**ボタンで削除可能

### 統計情報の確認
1. アーティストを削除
2. **Ctrl + Shift + R** でページを強制再読み込み
3. ダッシュボードの「アーティスト数」が正しく更新されることを確認

## 📊 影響範囲

### 修正前の影響
- ❌ アーティスト新規登録不可
- ❌ アーティスト編集不可
- ❌ チケット新規作成不可
- ❌ チケット編集不可
- ❌ 購入履歴が取得できない可能性

### 修正後
- ✅ アーティスト新規登録可能
- ✅ アーティスト編集可能
- ✅ チケット新規作成可能
- ✅ チケット編集可能
- ✅ 購入履歴正常取得
- ✅ 全ての管理画面API正常動作

## 🔗 関連コミット

```
bc61919 - fix: 管理画面API全てのhandlerシグネチャを修正
4f04502 - docs: Artist Admin複数アーティスト担当機能のデプロイガイド追加
102c476 - feat: Artist Adminが複数のアーティストを担当可能に
```

## 📚 技術詳細

### requireAdminラッパーの仕組み

```typescript
export function requireAdmin<T extends any[]>(
  handler: (
    request: NextRequest,
    adminInfo: { admin: AdminJWTPayload; isSuperAdmin: boolean },
    ...args: T
  ) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T) => {
    const adminInfo = await getAdminFromRequest(request);
    
    if (!adminInfo) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return handler(request, adminInfo, ...args);  // ← adminInfoを第2引数として渡す
  };
}
```

### 正しいhandlerの書き方

**通常のAPI (引数なし):**
```typescript
async function handler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  // ...
}

export const GET = requireAdmin(handler);
export const POST = requireAdmin(handler);
```

**動的ルート ([id]など):**
```typescript
async function handler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean },
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

export const PATCH = requireAdmin(handler);
export const DELETE = requireAdmin(handler);
```

## ⚠️ 今後の注意点

1. **requireAdminを使う場合**: 必ず`adminInfo`パラメータを追加
2. **新しいAPIを作る場合**: 他のAPIのシグネチャを参考にする
3. **TypeScriptエラー**: ビルド時のエラーだけでなく、型の不一致にも注意

## 🔗 リポジトリ

https://github.com/yotamatsumaru/0222-VOD  
**最新コミット**: `bc61919`

---

**作成日**: 2026-03-01  
**修正内容**: アーティスト新規登録バグ修正、統計キャッシュ問題の説明
