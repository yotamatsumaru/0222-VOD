import { NextResponse } from 'next/server';
import { getAll } from '@/lib/db';
import { Ticket } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get event ID from slug
    const event = await getAll<{ id: number }>(
      'SELECT id FROM events WHERE slug = $1',
      [slug]
    );

    if (event.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const tickets = await getAll<Ticket>(
      `
      SELECT * FROM tickets
      WHERE event_id = $1 AND is_active = true
      ORDER BY price ASC
    `,
      [event[0].id]
    );

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Tickets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
