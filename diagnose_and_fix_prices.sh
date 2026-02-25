#!/bin/bash

# チケット価格を詳細診断して修正するスクリプト

echo "========================================="
echo "チケット価格 詳細診断・修正スクリプト"
echo "========================================="
echo ""

DB_URL="postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

echo "ステップ1: 全チケットの詳細情報を表示"
echo "========================================="
psql "$DB_URL" <<EOF
SELECT 
  id,
  name,
  price as db_price_cents,
  price/100 as display_price_yen,
  currency,
  CASE 
    WHEN price >= 10000000 THEN '🔴 異常に高い (1,000,000円以上)'
    WHEN price >= 1000000 THEN '🟡 やや高い (100,000円以上)'
    WHEN price < 100000 THEN '🟢 正常範囲 (10,000円未満)'
    ELSE '🟢 正常'
  END as status_check,
  event_id,
  stock,
  sold,
  is_active
FROM tickets 
ORDER BY price DESC, id;
EOF

echo ""
echo "ステップ2: 価格分析"
echo "========================================="
psql "$DB_URL" <<EOF
SELECT 
  COUNT(*) as total_tickets,
  MIN(price/100) as min_price_yen,
  MAX(price/100) as max_price_yen,
  AVG(price/100)::INTEGER as avg_price_yen,
  COUNT(CASE WHEN price > 10000000 THEN 1 END) as very_high_price_count,
  COUNT(CASE WHEN price BETWEEN 1000000 AND 10000000 THEN 1 END) as high_price_count,
  COUNT(CASE WHEN price < 1000000 THEN 1 END) as normal_price_count
FROM tickets;
EOF

echo ""
echo "ステップ3: 修正が必要なチケットを特定"
echo "========================================="
psql "$DB_URL" <<EOF
SELECT 
  id,
  name,
  price as current_cents,
  price/100 as current_yen,
  CASE 
    -- 5000000円の場合、おそらく50000円が正しい
    WHEN price/100 = 5000000 THEN 5000000
    -- 500000円の場合、おそらく5000円が正しい
    WHEN price/100 = 500000 THEN 500000
    -- 50000円の場合、そのまま
    WHEN price/100 = 50000 THEN 5000000
    ELSE price
  END as suggested_correct_cents,
  CASE 
    WHEN price/100 = 5000000 THEN 50000
    WHEN price/100 = 500000 THEN 5000
    WHEN price/100 = 50000 THEN 50000
    ELSE price/100
  END as suggested_correct_yen
FROM tickets
WHERE price > 10000000 OR price/100 > 100000
ORDER BY price DESC;
EOF

echo ""
echo "========================================="
echo "修正オプション"
echo "========================================="
echo ""
echo "以下のいずれかの方法で修正してください："
echo ""
echo "【方法1】管理画面から修正（最も安全・推奨）"
echo "  1. http://18.178.182.252/admin にアクセス"
echo "  2. チケット管理 → 該当チケットの「編集」"
echo "  3. 価格フィールドに正しい金額を入力（例: 50000）"
echo "  4. 「更新」ボタンをクリック"
echo ""
echo "【方法2】このスクリプトで一括修正"
echo "  下記のSQLコマンドを確認して、正しければ実行："
echo ""

# 修正が必要なチケットのIDと推奨価格を取得
psql "$DB_URL" -t -c "
SELECT 
  'psql \"$DB_URL\" -c \"UPDATE tickets SET price = ' || 
  CASE 
    WHEN price/100 = 5000000 THEN '5000000'
    WHEN price/100 = 500000 THEN '500000'
    WHEN price/100 = 50000 THEN '5000000'
    ELSE price::TEXT
  END || 
  ' WHERE id = ' || id || ';\"  # ' || name || ' を ' ||
  CASE 
    WHEN price/100 = 5000000 THEN '50,000'
    WHEN price/100 = 500000 THEN '5,000'
    WHEN price/100 = 50000 THEN '50,000'
    ELSE (price/100)::TEXT
  END || '円に修正'
FROM tickets
WHERE price > 10000000 OR price/100 > 100000
ORDER BY id;
"

echo ""
echo "【方法3】手動でSQLを実行"
echo "  個別に修正する場合："
echo "  psql \"$DB_URL\""
echo "  UPDATE tickets SET price = 5000000 WHERE id = 1;  -- 50,000円"
echo "  UPDATE tickets SET price = 3000000 WHERE id = 2;  -- 30,000円"
echo ""
echo "========================================="
echo "価格変換表（参考）"
echo "========================================="
echo "  3,000円   = 300000 銭"
echo "  5,000円   = 500000 銭"
echo "  8,000円   = 800000 銭"
echo "  10,000円  = 1000000 銭"
echo "  30,000円  = 3000000 銭"
echo "  50,000円  = 5000000 銭"
echo "  100,000円 = 10000000 銭"
echo ""
echo "========================================="
echo ""
echo "⚠️  重要な注意事項"
echo ""
echo "1. 管理画面で編集する場合："
echo "   - 「円」単位で入力してください（例: 50000）"
echo "   - 「銭」単位では入力しないでください"
echo ""
echo "2. 修正後は必ずアプリを再起動："
echo "   pm2 restart streaming-app"
echo ""
echo "3. ブラウザのキャッシュをクリア："
echo "   Ctrl+Shift+R (Windows/Linux)"
echo "   Cmd+Shift+R (Mac)"
echo ""
echo "========================================="
