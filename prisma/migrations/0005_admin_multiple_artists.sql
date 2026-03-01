-- Artist Adminが複数のアーティストを管理できるようにする
-- 実行日: 2026-03-01

-- Step 1: 中間テーブル作成（Admin ↔ Artist の多対多関係）
CREATE TABLE IF NOT EXISTS admin_artists (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_id, artist_id)  -- 同じ組み合わせの重複を防ぐ
);

-- Step 2: インデックス追加
CREATE INDEX IF NOT EXISTS idx_admin_artists_admin_id ON admin_artists(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_artists_artist_id ON admin_artists(artist_id);

-- Step 3: 既存のartist_idデータを中間テーブルに移行
INSERT INTO admin_artists (admin_id, artist_id)
SELECT id, artist_id
FROM admins
WHERE artist_id IS NOT NULL AND role = 'artist_admin'
ON CONFLICT (admin_id, artist_id) DO NOTHING;

-- Step 4: admins.artist_id カラムは後方互換性のため残す（非推奨）
-- 将来的に削除可能だが、既存コードが依存している可能性があるため保持

-- Step 5: 便利なビューを更新（複数アーティスト対応）
DROP VIEW IF EXISTS admin_with_artist;

CREATE OR REPLACE VIEW admin_with_artists AS
SELECT 
    a.id,
    a.username,
    a.email,
    a.role,
    a.is_active,
    ARRAY_AGG(aa.artist_id) FILTER (WHERE aa.artist_id IS NOT NULL) as artist_ids,
    ARRAY_AGG(ar.name) FILTER (WHERE ar.name IS NOT NULL) as artist_names,
    a.created_at,
    a.updated_at
FROM admins a
LEFT JOIN admin_artists aa ON a.id = aa.admin_id
LEFT JOIN artists ar ON aa.artist_id = ar.id
WHERE a.is_active = true
GROUP BY a.id, a.username, a.email, a.role, a.is_active, a.created_at, a.updated_at;

-- Step 6: 便利な関数 - 管理者が特定のアーティストを管理できるかチェック
CREATE OR REPLACE FUNCTION admin_can_manage_artist(
    p_admin_id INTEGER,
    p_artist_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(20);
    v_can_manage BOOLEAN;
BEGIN
    -- 管理者のロールを取得
    SELECT role INTO v_role FROM admins WHERE id = p_admin_id;
    
    -- Super Adminは全てのアーティストを管理できる
    IF v_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Artist Adminは割り当てられたアーティストのみ管理できる
    SELECT EXISTS(
        SELECT 1 FROM admin_artists 
        WHERE admin_id = p_admin_id AND artist_id = p_artist_id
    ) INTO v_can_manage;
    
    RETURN v_can_manage;
END;
$$ LANGUAGE plpgsql;

-- Step 7: 便利な関数 - 管理者が管理できるアーティストIDの配列を取得
CREATE OR REPLACE FUNCTION get_admin_artist_ids(p_admin_id INTEGER)
RETURNS INTEGER[] AS $$
DECLARE
    v_role VARCHAR(20);
    v_artist_ids INTEGER[];
BEGIN
    -- 管理者のロールを取得
    SELECT role INTO v_role FROM admins WHERE id = p_admin_id;
    
    -- Super Adminは全てのアーティストIDを返す
    IF v_role = 'super_admin' THEN
        SELECT ARRAY_AGG(id) INTO v_artist_ids FROM artists;
        RETURN v_artist_ids;
    END IF;
    
    -- Artist Adminは割り当てられたアーティストIDのみ返す
    SELECT ARRAY_AGG(artist_id) INTO v_artist_ids 
    FROM admin_artists 
    WHERE admin_id = p_admin_id;
    
    RETURN COALESCE(v_artist_ids, ARRAY[]::INTEGER[]);
END;
$$ LANGUAGE plpgsql;

-- コメント追加
COMMENT ON TABLE admin_artists IS 'Artist Adminと担当アーティストの多対多関係テーブル';
COMMENT ON COLUMN admin_artists.admin_id IS '管理者ID';
COMMENT ON COLUMN admin_artists.artist_id IS '担当アーティストID';
COMMENT ON FUNCTION admin_can_manage_artist(INTEGER, INTEGER) IS '管理者が特定のアーティストを管理できるかチェック';
COMMENT ON FUNCTION get_admin_artist_ids(INTEGER) IS '管理者が管理できるアーティストIDの配列を返す';

-- 完了
