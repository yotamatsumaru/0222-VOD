-- Insert sample artists
INSERT OR IGNORE INTO artists (id, name, slug, description, image_url) VALUES 
  (1, 'Sample Artist', 'sample-artist', 'サンプルアーティストの説明文です。', 'https://via.placeholder.com/400x400'),
  (2, 'Test Band', 'test-band', 'テストバンドのプロフィールです。', 'https://via.placeholder.com/400x400');

-- Insert sample events
INSERT OR IGNORE INTO events (id, artist_id, title, slug, description, thumbnail_url, event_type, stream_url, status, start_time) VALUES 
  (1, 1, 'Sample Live Concert 2024', 'sample-live-2024', 'サンプルライブコンサートの説明です。', 'https://via.placeholder.com/800x450', 'live', 'https://example.cloudfront.net/live/stream.m3u8', 'upcoming', '2024-03-31 19:00:00'),
  (2, 1, 'Archive Concert', 'archive-concert', 'アーカイブ配信のサンプルです。', 'https://via.placeholder.com/800x450', 'archive', 'https://example.cloudfront.net/archive/video.m3u8', 'archived', '2024-01-15 19:00:00'),
  (3, 2, 'Test Band Live', 'test-band-live', 'テストバンドのライブ配信です。', 'https://via.placeholder.com/800x450', 'live', 'https://example.cloudfront.net/live/test.m3u8', 'upcoming', '2024-04-10 20:00:00');

-- Insert sample tickets
INSERT OR IGNORE INTO tickets (id, event_id, name, description, price, currency, stock) VALUES 
  (1, 1, '通常チケット', 'ライブ配信視聴チケット', 3000, 'jpy', 100),
  (2, 1, 'プレミアムチケット', 'ライブ+アーカイブ視聴チケット', 5000, 'jpy', 50),
  (3, 2, 'アーカイブ視聴チケット', 'アーカイブ配信視聴チケット', 2000, 'jpy', NULL),
  (4, 3, '早割チケット', '早期購入割引チケット', 2500, 'jpy', 200);

-- Insert admin user (password: admin123 - bcrypt hash)
-- Note: This is a sample hash, you should generate a new one for production
INSERT OR IGNORE INTO admins (username, password_hash) VALUES 
  ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
