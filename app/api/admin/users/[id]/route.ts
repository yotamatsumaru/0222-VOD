import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuthNew';
import { getOne, getAll } from '@/lib/db';

async function getHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Super Adminのみアクセス可能
    if (!adminInfo.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super Admin権限が必要です' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // ユーザー基本情報
    const user = await getOne(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 購入履歴
    const purchases = await getAll(
      `SELECT 
        p.id,
        p.purchased_at,
        p.amount,
        p.currency,
        p.status,
        e.title as event_title,
        e.slug as event_slug,
        t.name as ticket_name
       FROM purchases p
       LEFT JOIN events e ON p.event_id = e.id
       LEFT JOIN tickets t ON p.ticket_id = t.id
       WHERE p.user_id = $1
       ORDER BY p.purchased_at DESC`,
      [id]
    );

    return NextResponse.json({
      ...user,
      purchases
    });
  } catch (error: any) {
    console.error('Get user detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getHandler);

