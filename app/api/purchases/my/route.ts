import { NextRequest, NextResponse } from 'next/server';
import { getAll } from '@/lib/db';
import { verifyToken } from '@/lib/userAuth';

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyToken(token);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'ログインセッションが無効です' },
        { status: 401 }
      );
    }

    // Fetch user's purchases with event and ticket details
    const purchases = await getAll(
      `
      SELECT 
        p.id,
        p.event_id,
        p.ticket_id,
        p.amount,
        p.currency,
        p.status,
        p.purchased_at,
        p.access_token,
        p.token_expires_at,
        e.title as event_title,
        e.slug as event_slug,
        t.name as ticket_name
      FROM purchases p
      JOIN events e ON p.event_id = e.id
      JOIN tickets t ON p.ticket_id = t.id
      WHERE p.user_id = $1
      ORDER BY p.purchased_at DESC
      `,
      [userPayload.userId]
    );

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Get user purchases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
