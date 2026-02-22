import { NextResponse } from 'next/server';
import { getOne } from '@/lib/db';
import { Event } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await getOne<Event>(
      `
      SELECT e.*, a.name as artist_name, a.slug as artist_slug, a.image_url as artist_image
      FROM events e
      LEFT JOIN artists a ON e.artist_id = a.id
      WHERE e.slug = $1
    `,
      [slug]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Event detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
