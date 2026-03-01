import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne } from './db';
import { Admin } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7日間有効

export interface AdminJWTPayload {
  adminId: number;
  username: string;
  role: 'super_admin' | 'artist_admin';
  email?: string;
  artistId?: number;
  artistName?: string;
}

/**
 * 最高管理者（Super Admin）の認証
 * .envに設定されたID/パスワードで認証
 */
export async function authenticateSuperAdmin(username: string, password: string): Promise<boolean> {
  const superUsername = process.env.SUPER_ADMIN_USERNAME || 'admin';
  const superPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  
  return username === superUsername && password === superPassword;
}

/**
 * アーティスト管理者（Artist Admin）の認証
 * データベースに登録された管理者で認証
 */
export async function authenticateArtistAdmin(username: string, password: string): Promise<Admin | null> {
  try {
    const admin = await getOne<Admin>(
      `SELECT * FROM admins 
       WHERE username = $1 AND role = 'artist_admin' AND is_active = true`,
      [username]
    );

    if (!admin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  } catch (error) {
    console.error('Artist admin authentication error:', error);
    return null;
  }
}

/**
 * 管理者の認証（Super Admin または Artist Admin）
 */
export async function authenticateAdmin(username: string, password: string): Promise<{
  success: boolean;
  admin?: Admin;
  role?: 'super_admin' | 'artist_admin';
  token?: string;
}> {
  // まず Super Admin として認証を試みる
  const isSuperAdmin = await authenticateSuperAdmin(username, password);
  if (isSuperAdmin) {
    const token = generateAdminToken({
      adminId: 0, // Super Admin は ID 0 とする
      username,
      role: 'super_admin',
    });

    return {
      success: true,
      role: 'super_admin',
      token,
      admin: {
        id: 0,
        username,
        password_hash: '',
        role: 'super_admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  }

  // Artist Admin として認証を試みる
  const artistAdmin = await authenticateArtistAdmin(username, password);
  if (artistAdmin) {
    const token = generateAdminToken({
      adminId: artistAdmin.id,
      username: artistAdmin.username,
      role: 'artist_admin',
      artistId: artistAdmin.artist_id,
    });

    return {
      success: true,
      admin: artistAdmin,
      role: 'artist_admin',
      token,
    };
  }

  return { success: false };
}

/**
 * 管理者用JWTトークンを生成
 */
export function generateAdminToken(payload: AdminJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 管理者用JWTトークンを検証
 */
export function verifyAdminToken(token: string): AdminJWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminJWTPayload;
    return payload;
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
}

/**
 * リクエストから管理者情報を取得
 */
export async function getAdminFromRequest(request: NextRequest): Promise<{
  admin: AdminJWTPayload;
  isSuperAdmin: boolean;
} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyAdminToken(token);

  if (!payload) {
    return null;
  }

  return {
    admin: payload,
    isSuperAdmin: payload.role === 'super_admin',
  };
}

/**
 * 権限チェック：Super Admin のみアクセス可能
 */
export function requireSuperAdmin<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T) => {
    const adminInfo = await getAdminFromRequest(request);

    if (!adminInfo || !adminInfo.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * 権限チェック：任意の管理者（Super Admin または Artist Admin）
 */
export function requireAdmin<T extends any[]>(
  handler: (
    request: NextRequest,
    adminInfo: { admin: AdminJWTPayload; isSuperAdmin: boolean },
    ...args: T
  ) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T) => {
    const adminInfo = await getAdminFromRequest(request);

    if (!adminInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, adminInfo, ...args);
  };
}

/**
 * アーティスト管理者が指定されたアーティストを管理できるかチェック
 */
export function canManageArtist(
  adminInfo: { admin: AdminJWTPayload; isSuperAdmin: boolean },
  artistId: number
): boolean {
  // Super Admin は全てのアーティストを管理できる
  if (adminInfo.isSuperAdmin) {
    return true;
  }

  // Artist Admin は自分のアーティストのみ管理できる
  return adminInfo.admin.artistId === artistId;
}

/**
 * アーティスト管理者が指定されたイベントを管理できるかチェック
 */
export async function canManageEvent(
  adminInfo: { admin: AdminJWTPayload; isSuperAdmin: boolean },
  eventId: number
): Promise<boolean> {
  // Super Admin は全てのイベントを管理できる
  if (adminInfo.isSuperAdmin) {
    return true;
  }

  // Artist Admin は自分のアーティストのイベントのみ管理できる
  try {
    const event = await getOne<{ artist_id: number }>(
      'SELECT artist_id FROM events WHERE id = $1',
      [eventId]
    );

    if (!event) {
      return false;
    }

    return adminInfo.admin.artistId === event.artist_id;
  } catch (error) {
    console.error('Can manage event check error:', error);
    return false;
  }
}

// 旧システムとの互換性のために残す（非推奨）
export async function basicAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const result = await authenticateAdmin(username, password);

  if (result.success) {
    return null; // Authentication successful
  }

  return new NextResponse('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  });
}

export function requireAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T) => {
    const authError = await basicAuth(request);
    if (authError) {
      return authError;
    }
    return handler(request, ...args);
  };
}
