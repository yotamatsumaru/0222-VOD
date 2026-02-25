#!/bin/bash

# チケット価格を修正するスクリプト
# EC2上で実行してください

echo "========================================="
echo "チケット価格修正スクリプト"
echo "========================================="
echo ""

DB_URL="postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

echo "1. 現在のチケット情報を詳細表示..."
echo ""
psql "$DB_URL" -c "
SELECT 
  id, 
  name, 
  price as price_cents,
  price/100 as price_yen,
  currency,
  CASE 
    WHEN price > 1000000 THEN '⚠️  価格が異常に高い'
    ELSE '✓ 正常'
  END as status
FROM tickets 
ORDER BY id;
"

echo ""
echo "2. 異常な価格のチケットを特定..."
echo ""
psql "$DB_URL" -c "
SELECT 
  id,
  name,
  price as current_price_cents,
  price/100 as current_price_yen,
  '修正が必要' as note
FROM tickets 
WHERE price > 1000000
ORDER BY id;
"

echo ""
echo "========================================="
echo "修正方法"
echo "========================================="
echo ""
echo "方法1: 管理画面から修正（推奨）"
echo "  1. http://18.178.182.252/admin にアクセス"
echo "  2. 「チケット管理」をクリック"
echo "  3. 該当チケットの「編集」ボタンをクリック"
echo "  4. 価格フィールドに正しい金額を入力（例: 5000）"
echo "  5. 通貨で「JPY (日本円)」を選択"
echo "  6. 「更新」ボタンをクリック"
echo ""
echo "方法2: SQLで直接修正"
echo "  特定のチケットを修正する場合:"
echo "  psql \"$DB_URL\" -c \"UPDATE tickets SET price = 500000 WHERE id = 1;\""
echo ""
echo "  ※ 5,000円 = 500000銭"
echo "  ※ 10,000円 = 1000000銭"
echo ""
echo "========================================="
