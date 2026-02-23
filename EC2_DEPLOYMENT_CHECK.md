# EC2デプロイ確認手順

## 現在の問題
- `/mypage-test` にアクセスしても404エラー
- これは、EC2に最新のコードがデプロイされていないことを意味します

## 確認手順

### 1. EC2にSSH接続
```bash
ssh ec2-user@18.178.182.252
```

### 2. 現在のGitコミットを確認
```bash
cd /home/ec2-user/webapp
git log --oneline -3
```

**期待される出力:**
```
422d824 fix: マイページリンクをbuttonからLinkに戻し、テストページ追加
5700788 fix: マイページにmounted状態を追加してSSR問題を解決
5fd7c70 docs: マイページ遷移問題のデバッグガイド追加
```

### 3. 最新のコードを取得
```bash
git pull origin main
```

### 4. デプロイスクリプトを実行
```bash
./deploy.sh
```

**または、手動でデプロイ:**
```bash
npm install
node scripts/migrate.js
npm run build
pm2 restart webapp
```

### 5. PM2のステータス確認
```bash
pm2 list
```

**期待される出力:**
```
┌─────┬──────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ mode    │ status  │ restart │ uptime   │
├─────┼──────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ webapp   │ fork    │ online  │ 0       │ xxs      │
└─────┴──────────┴─────────┴─────────┴─────────┴──────────┘
```

### 6. ログを確認
```bash
pm2 logs webapp --lines 50
```

**探すべきログ:**
- `✓ Compiled successfully`
- `Ready in xxxms`
- エラーメッセージがないか

### 7. ビルドファイルの確認
```bash
ls -la /home/ec2-user/webapp/.next/server/app/mypage-test/
```

**期待される出力:**
```
page.js
page.js.map
page.js.nft.json
```

このディレクトリが存在しない場合、ビルドが完了していません。

### 8. ブラウザでテスト

#### テスト1: ヘルスチェック
```
http://18.178.182.252/api/health
```
**期待される出力:** `{"status":"ok","database":"connected",...}`

#### テスト2: テストページ
```
http://18.178.182.252/mypage-test
```
**期待される出力:** 「MyPage Test」という見出し

#### テスト3: マイページ（直接アクセス）
```
http://18.178.182.252/mypage
```
ログイン済みであれば、マイページが表示される

## トラブルシューティング

### 問題A: `git pull` でエラーが出る
```bash
git status
git stash
git pull origin main
```

### 問題B: `npm run build` でエラーが出る
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### 問題C: PM2が起動しない
```bash
pm2 delete webapp
cd /home/ec2-user/webapp
npm run build
pm2 start npm --name webapp -- start
pm2 save
```

### 問題D: ポート3000が使用中
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart webapp
```

### 問題E: 環境変数が読み込まれない
```bash
cat /home/ec2-user/webapp/.env.local
```
必要な環境変数がすべて設定されているか確認

## 完了後の報告

以下の情報を共有してください：

1. `git log --oneline -3` の出力
2. `pm2 list` の出力
3. `pm2 logs webapp --lines 20` の出力
4. `http://18.178.182.252/mypage-test` へのアクセス結果
5. エラーメッセージ（あれば）
