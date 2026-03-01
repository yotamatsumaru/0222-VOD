import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuthNew';
import { getAll } from '@/lib/db';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let query = `
      SELECT 
        p.*,
        e.title as event_title,
        t.name as ticket_name
      FROM purchases p
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN tickets t ON p.ticket_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (eventId) {
      query += ` AND p.event_id = $${params.length + 1}`;
      params.push(parseInt(eventId));
    }

    query += ' ORDER BY p.purchased_at DESC LIMIT 100';

    const purchases = await getAll(query, params);

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(handler);
