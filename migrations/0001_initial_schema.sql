-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table (live events or archived content)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Event type: 'live' or 'archive'
  event_type TEXT NOT NULL DEFAULT 'live',
  
  -- Streaming URLs (CloudFront or MediaPackage endpoints)
  stream_url TEXT,
  archive_url TEXT,
  
  -- CloudFront key pair ID for signed URLs
  cloudfront_key_pair_id TEXT,
  
  -- Schedule
  start_time DATETIME,
  end_time DATETIME,
  
  -- Status: 'upcoming', 'live', 'ended', 'archived'
  status TEXT NOT NULL DEFAULT 'upcoming',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

-- Tickets table (price tiers for events)
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents (e.g., 5000 = ¥5000)
  currency TEXT NOT NULL DEFAULT 'jpy',
  
  -- Stripe product/price IDs
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Availability
  stock INTEGER, -- NULL = unlimited
  sold_count INTEGER DEFAULT 0,
  
  -- Sale period
  sale_start DATETIME,
  sale_end DATETIME,
  
  is_active INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Purchases table (ticket purchase records)
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  ticket_id INTEGER NOT NULL,
  
  -- Customer info (from Stripe)
  stripe_customer_id TEXT NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  
  -- Payment info
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'jpy',
  
  -- Status: 'pending', 'completed', 'refunded', 'cancelled'
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Access token for viewing (JWT or random token)
  access_token TEXT UNIQUE,
  
  -- Token expiry (for time-limited access)
  access_expires_at DATETIME,
  
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Admin users table (simple auth for content management)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  role TEXT NOT NULL DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_artist_id ON events(artist_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_customer ON purchases(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_access_token ON purchases(access_token);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
