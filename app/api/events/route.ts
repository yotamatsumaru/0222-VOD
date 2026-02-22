import { NextResponse } from 'next/server';
import { getAll } from '@/lib/db';
import { Event } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const artistId = searchParams.get('artistId');

    let query = `
      SELECT e.*, a.name as artist_name, a.slug as artist_slug
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    if (artistId) {
      query += ` AND e.artist_id = $${params.length + 1}`;
      params.push(parseInt(artistId));
    }

    query += ` ORDER BY 
      CASE WHEN e.status = 'live' THEN 0 ELSE 1 END,
      e.start_time ASC
    `;

    const events = await getAll<Event>(query, params);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
