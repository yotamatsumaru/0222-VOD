-- 管理者の役割（ロール）を追加するマイグレーション
-- 実行日: 2026-02-25

-- Step 1: adminsテーブルに新しいカラムを追加
ALTER TABLE admins 
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'artist_admin' CHECK (role IN ('super_admin', 'artist_admin')),
  ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: 既存の管理者を super_admin に設定
UPDATE admins SET role = 'super_admin' WHERE role IS NULL OR role = 'artist_admin';

-- Step 3: インデックスを追加
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_artist_id ON admins(artist_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Step 4: updated_atトリガーを追加
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: アーティスト管理者のビューを作成（便利なクエリ用）
CREATE OR REPLACE VIEW admin_with_artist AS
SELECT 
    a.id,
    a.username,
    a.email,
    a.role,
    a.is_active,
    a.artist_id,
    ar.name as artist_name,
    ar.slug as artist_slug,
    a.created_at,
    a.updated_at
FROM admins a
LEFT JOIN artists ar ON a.artist_id = ar.id
WHERE a.is_active = true;

-- 完了
COMMENT ON TABLE admins IS '管理者テーブル。super_admin（最高管理者）とartist_admin（アーティスト管理者）の2つのロールがある';
COMMENT ON COLUMN admins.role IS '管理者の役割: super_admin（全て管理）、artist_admin（自分のアーティストのみ管理）';
COMMENT ON COLUMN admins.artist_id IS 'アーティスト管理者の場合、管理するアーティストのID。super_adminの場合はNULL';
COMMENT ON COLUMN admins.email IS '管理者のメールアドレス（オプション）';
COMMENT ON COLUMN admins.is_active IS '管理者アカウントが有効かどうか';
