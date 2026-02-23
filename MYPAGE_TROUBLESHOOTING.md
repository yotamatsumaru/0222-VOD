# マイページアクセス問題のトラブルシューティング

## 問題
ログイン後、ナビゲーションバーのユーザー名をクリックしてもマイページ（/mypage）に遷移しない

## 確認手順

### 1. ブラウザのコンソールを開く

1. ブラウザでサイトにアクセス（http://18.178.182.252/）
2. **F12キー**を押して開発者ツールを開く
3. **Console**タブをクリック

### 2. ログイン状態を確認

コンソールに以下のコマンドを入力して実行：

```javascript
// ログイントークンの確認
console.log('Auth Token:', localStorage.getItem('authToken'));

// ログイン状態の確認
console.log('Token exists:', !!localStorage.getItem('authToken'));
```

**期待される結果**:
- `Auth Token: eyJhbGciOiJIUzI1NiIsInR5cCI6...` （長い文字列）
- `Token exists: true`

### 3. ユーザー情報APIをテスト

コンソールで実行：

```javascript
// ユーザー情報を取得
fetch('/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(data => console.log('User data:', data))
.catch(err => console.error('Error:', err));
```

**期待される結果**:
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "テストユーザー"
  }
}
```

### 4. ナビゲーションバーのログを確認

サイトをリロードして、コンソールに以下のログが表示されるか確認：

```
[Navigation] Is authenticated: true
[Navigation] User info response: 200
[Navigation] User data: { user: { ... } }
```

### 5. マイページに直接アクセス

ブラウザのアドレスバーに直接入力：
```
http://18.178.182.252/mypage
```

**結果**:
- ✅ マイページが表示される → ナビゲーションリンクの問題
- ✗ ログインページにリダイレクト → 認証の問題

---

## 解決方法

### ケース1: トークンが存在しない

**原因**: ログイン時にトークンが保存されていない

**解決策**:
1. もう一度ログインする
2. ログイン後、コンソールで `localStorage.getItem('authToken')` を確認

### ケース2: トークンが期限切れ

**原因**: JWTトークンが7日以上前に発行された

**解決策**:
1. ログアウトして再ログイン
2. 新しいトークンが発行される

### ケース3: ナビゲーションバーが更新されない

**原因**: ログイン後にナビゲーションコンポーネントが再レンダリングされていない

**解決策**:
1. ログイン後、ページをリロード（F5）
2. ナビゲーションバーにユーザー名が表示されるか確認

### ケース4: リンクがクリックできない

**原因**: CSSの問題でリンクが無効になっている

**解決策**:

ブラウザのコンソールで実行：
```javascript
// リンク要素を確認
const mypageLink = document.querySelector('a[href="/mypage"]');
console.log('MyPage link found:', !!mypageLink);
console.log('Link element:', mypageLink);
```

---

## 簡易テストページ

以下のURLで直接マイページにアクセスできるか確認：

```
http://18.178.182.252/mypage
```

**ログインしている場合**: 購入履歴が表示される  
**ログインしていない場合**: ログインページにリダイレクト

---

## EC2でのログ確認

```bash
ssh ec2-user@18.178.182.252

# アプリケーションログを確認
pm2 logs webapp --lines 100 | grep -E "(Navigation|mypage|auth)"

# ブラウザのネットワークログを確認
# ブラウザ開発者ツール → Network タブ → Fetchリクエストを確認
```

---

## 緊急対処法

マイページに直接アクセスする方法：

### URLバーに直接入力
```
http://18.178.182.252/mypage
```

### またはトップページから
```
http://18.178.182.252/ → ナビゲーションバーの「ユーザー名」をクリック
```

### デバッグ用の一時的なボタンを追加

ホームページ（`app/page.tsx`）に以下を追加（テスト用）：

```tsx
<Link href="/mypage" className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg z-50">
  🔧 マイページ（テスト）
</Link>
```

---

上記の手順を実行して、コンソールのログやエラーメッセージをお知らせください。問題の原因を特定します。
