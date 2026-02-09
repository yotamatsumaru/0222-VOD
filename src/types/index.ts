export interface Bindings {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  JWT_SECRET: string;
  CLOUDFRONT_PRIVATE_KEY?: string;
  CLOUDFRONT_KEY_PAIR_ID?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

export interface Artist {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  artist_id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  event_type: 'live' | 'archive';
  stream_url?: string;
  archive_url?: string;
  cloudfront_key_pair_id?: string;
  start_time?: string;
  end_time?: string;
  status: 'upcoming' | 'live' | 'ended' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
  stock?: number;
  sold_count: number;
  sale_start?: string;
  sale_end?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  event_id: number;
  ticket_id: number;
  stripe_customer_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id?: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  access_token?: string;
  access_expires_at?: string;
  purchased_at: string;
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}
