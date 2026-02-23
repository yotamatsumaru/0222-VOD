-- Add user_id to purchases table to link purchases with users
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchases_user'
  ) THEN
    ALTER TABLE purchases ADD CONSTRAINT fk_purchases_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Create index for faster user purchase lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
