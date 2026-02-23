#!/bin/bash

# EC2デプロイスクリプト
# 使い方: EC2上で実行してください
# ssh ec2-user@18.178.182.252
# cd /home/ec2-user/webapp
# chmod +x deploy.sh
# ./deploy.sh

set -e  # エラーが発生したら即座に終了

echo "=========================================="
echo "EC2デプロイメント開始"
echo "=========================================="
echo ""

# 1. 最新コードを取得
echo "📥 Step 1: 最新コードを取得中..."
git pull origin main
echo "✅ 最新コードの取得完了"
echo ""

# 2. 依存関係のインストール
echo "📦 Step 2: 依存関係をインストール中..."
npm install
echo "✅ 依存関係のインストール完了"
echo ""

# 3. データベースマイグレーション
echo "🗄️  Step 3: データベースマイグレーションを実行中..."
node scripts/migrate.js
echo "✅ マイグレーション完了"
echo ""

# 4. プロダクションビルド
echo "🔨 Step 4: プロダクションビルド中..."
npm run build
echo "✅ ビルド完了"
echo ""

# 5. PM2再起動
echo "🔄 Step 5: PM2でアプリケーションを再起動中..."
pm2 restart webapp
echo "✅ PM2再起動完了"
echo ""

# 6. ヘルスチェック
echo "🏥 Step 6: ヘルスチェック中..."
sleep 3
HEALTH_STATUS=$(curl -s http://localhost:3000/api/health | grep -o '"status":"ok"' || echo "failed")

if [[ $HEALTH_STATUS == *"ok"* ]]; then
    echo "✅ ヘルスチェック成功！アプリケーションは正常に動作しています"
else
    echo "⚠️  警告: ヘルスチェックに失敗しました。ログを確認してください。"
    echo "    pm2 logs webapp --lines 50"
fi
echo ""

# 7. PM2ステータス表示
echo "📊 PM2ステータス:"
pm2 list
echo ""

echo "=========================================="
echo "✅ デプロイメント完了！"
echo "=========================================="
echo ""
echo "🌐 アプリケーションURL:"
echo "   - フロントエンド: http://18.178.182.252/"
echo "   - 管理画面: http://18.178.182.252/admin"
echo "   - ヘルスチェック: http://18.178.182.252/api/health"
echo ""
echo "📝 ログを確認するには:"
echo "   pm2 logs webapp --lines 50"
echo ""
echo "🔄 再起動が必要な場合:"
echo "   pm2 restart webapp"
echo ""
