// Database Types
export interface Artist {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: number;
  artist_id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  stream_url?: string;
  archive_url?: string;
  status: 'upcoming' | 'live' | 'ended' | 'archived';
  start_time?: Date;
  end_time?: Date;
  created_at: Date;
  updated_at: Date;
  artist?: Artist;
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  sold: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Purchase {
  id: number;
  event_id: number;
  ticket_id: number;
  stripe_session_id: string;
  stripe_payment_intent?: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  access_token?: string;
  token_expires_at?: Date;
  purchased_at: Date;
  event?: Event;
  ticket?: Ticket;
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  role: 'super_admin' | 'artist_admin';
  artist_id?: number;
  email?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  artist?: Artist;
}

export interface AdminWithArtist extends Admin {
  artist_name?: string;
  artist_slug?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Stripe Types
export interface CheckoutSessionData {
  ticketId: number;
  eventSlug: string;
  successUrl: string;
  cancelUrl: string;
}

// Auth Types
export interface JWTPayload {
  purchaseId: number;
  eventId: number;
  email: string;
  exp: number;
}

// CloudFront Types
export interface SignedUrlOptions {
  url: string;
  expiresIn?: number;
}

export interface SignedCookieOptions {
  domain: string;
  path: string;
  expiresIn?: number;
}
