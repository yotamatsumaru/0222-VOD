# マイページ遷移問題のデバッグ手順

## 現状
- ログイン成功: ✅
- ナビゲーションでマイページボタンクリック: ✅
- `router.push('/mypage')` 実行: ✅
- **問題**: マイページに遷移せず、トップページに戻される ❌

## デバッグ手順

### 1. EC2へデプロイ
```bash
ssh ec2-user@18.178.182.252
cd /home/ec2-user/webapp
git pull origin main
./deploy.sh
```

### 2. ブラウザで確認（重要）
1. ブラウザのコンソールを開く (F12 → Console)
2. ページをリロード (F5)
3. ログインする
4. ユーザー名アイコンをクリックしてマイページへ遷移を試みる

### 3. 確認すべきログ

**ナビゲーションログ:**
```
[Navigation] Is authenticated: true
[Navigation] User info response: 200
[Navigation] Navigating to MyPage
```

**マイページログ（重要）:**
```
[MyPage] Component mounted
[MyPage] Auth token: <token_value>
[MyPage] Starting to fetch user info...
[MyPage] User info fetched successfully: {user: ...}
[MyPage] Starting to fetch purchases...
[MyPage] Purchases fetched successfully: [...]
```

### 4. 予想される問題パターン

#### パターンA: トークンが取得できない
**ログ:**
```
[MyPage] Component mounted
[MyPage] Auth token: null
[MyPage] No auth token, redirecting to login...
```
**解決策:**
- `localStorage.getItem('authToken')` の値を確認
- ログイン後に正しく保存されているか確認

#### パターンB: SSRでlocalStorageにアクセスできない
**ログ:**
```
(何もログが出ない、またはエラー)
```
**解決策:**
- MyPageコンポーネントを完全にクライアントサイドレンダリングに変更

#### パターンC: API呼び出しが失敗
**ログ:**
```
[MyPage] Auth token: <token_value>
[MyPage] Starting to fetch user info...
[MyPage] Error fetching user info: ...
```
**解決策:**
- APIエンドポイントの確認
- トークンの有効性確認

### 5. 一時的な回避策

ブラウザのコンソールで直接マイページにアクセス:
```javascript
window.location.href = '/mypage'
```

### 6. 報告してほしい情報

1. ブラウザコンソールに表示される全ての `[MyPage]` で始まるログ
2. `localStorage.getItem('authToken')` の実行結果
3. エラーメッセージがあればその内容
4. `/mypage` に直接アクセスした場合の挙動

## 次のステップ

上記のデバッグ情報を共有いただければ、具体的な修正を行います。
