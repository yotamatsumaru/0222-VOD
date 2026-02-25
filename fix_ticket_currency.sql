-- 既存のチケットでcurrencyがNULLまたはusdになっているものをjpyに修正
UPDATE tickets 
SET currency = 'jpy' 
WHERE currency IS NULL OR currency != 'jpy';

-- 修正結果を確認
SELECT id, name, price, currency, event_id 
FROM tickets 
ORDER BY id;
