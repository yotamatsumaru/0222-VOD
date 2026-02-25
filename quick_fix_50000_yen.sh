#!/bin/bash

# 50,000円のチケットが5,000,000円になる問題を修正

DB_URL="postgresql://postgres:Yota19990514@database-2.c9qsy8o0qu9q.ap-northeast-1.rds.amazonaws.com:5432/streaming_platform"

echo "========================================="
echo "チケット価格 緊急修正"
echo "========================================="
echo ""
echo "問題: 50,000円のチケットが 5,000,000円 と表示される"
echo "原因: DB に 500000000 銭 が保存されている"
echo "修正: 5000000 銭（50,000円）に変更"
echo ""

echo "現在の価格を確認中..."
psql "$DB_URL" -c "SELECT id, name, price, price/100 as price_yen FROM tickets ORDER BY id;"

echo ""
read -p "全てのチケットを自動修正しますか？ (y/N): " confirm

if [[ $confirm == [yY] ]]; then
  echo ""
  echo "修正を実行中..."
  
  # 5,000,000円（500000000銭）→ 50,000円（5000000銭）に修正
  psql "$DB_URL" -c "UPDATE tickets SET price = 5000000 WHERE price = 500000000;"
  
  # 500,000円（50000000銭）→ 5,000円（500000銭）に修正
  psql "$DB_URL" -c "UPDATE tickets SET price = 500000 WHERE price = 50000000;"
  
  echo ""
  echo "修正後の価格を確認中..."
  psql "$DB_URL" -c "SELECT id, name, price, price/100 as price_yen FROM tickets ORDER BY id;"
  
  echo ""
  echo "✅ 修正完了！"
  echo ""
  echo "次のステップ:"
  echo "1. pm2 restart streaming-app"
  echo "2. ブラウザのキャッシュをクリア（Ctrl+Shift+R）"
  echo "3. イベント詳細ページで価格を確認"
  echo "4. Stripeチェックアウトで価格を確認"
else
  echo ""
  echo "修正をキャンセルしました。"
  echo ""
  echo "個別に修正する場合:"
  echo "psql \"$DB_URL\" -c \"UPDATE tickets SET price = 5000000 WHERE id = <チケットID>;\""
fi

echo ""
echo "========================================="
