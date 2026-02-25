#!/bin/bash

# チケット通貨を緊急修正するスクリプト
# EC2上で実行してください

echo "==================================="
echo "チケット通貨修正スクリプト"
echo "==================================="
echo ""

DB_URL="postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

echo "1. 現在のチケット情報を確認中..."
echo ""
psql "$DB_URL" -c "SELECT id, name, price, price/100 as price_yen, currency FROM tickets ORDER BY id;"

echo ""
echo "2. currency が jpy でないチケットを確認中..."
echo ""
psql "$DB_URL" -c "SELECT id, name, price, price/100 as price_yen, currency FROM tickets WHERE currency IS NULL OR currency != 'jpy';"

echo ""
echo "3. currency を jpy に修正しています..."
echo ""
psql "$DB_URL" -c "UPDATE tickets SET currency = 'jpy' WHERE currency IS NULL OR currency != 'jpy';"

echo ""
echo "4. 修正後のチケット情報を確認中..."
echo ""
psql "$DB_URL" -c "SELECT id, name, price, price/100 as price_yen, currency FROM tickets ORDER BY id;"

echo ""
echo "==================================="
echo "✅ 修正完了！"
echo "==================================="
echo ""
echo "次のステップ："
echo "1. アプリを再起動: pm2 restart streaming-app"
echo "2. ブラウザのキャッシュをクリア（Ctrl+Shift+R）"
echo "3. チケット購入画面で ¥ 表示を確認"
echo ""
echo "⚠️  価格が異常に高い場合（例: ¥50,012）："
echo "   管理画面でチケットを編集し、正しい価格（例: 5000）を入力して保存してください"
