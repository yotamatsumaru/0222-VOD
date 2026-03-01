import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuthNew';
import { getAll } from '@/lib/db';

interface User {
  id: number;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
  purchase_count?: number;
  total_spent?: number;
}

async function getHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  try {
    // Super Adminのみアクセス可能
    if (!adminInfo.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin権限が必要です' },
        { status: 403 }
      );
    }

    // ユーザー一覧を購入情報付きで取得
    const users = await getAll<User>(
      `SELECT 
        u.id,
        u.email,
        u.username,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT p.id) as purchase_count,
        COALESCE(SUM(p.amount), 0) as total_spent
       FROM users u
       LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
       GROUP BY u.id, u.email, u.username, u.created_at, u.updated_at
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Get users error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getHandler);
