import { NextResponse } from 'next/server';
import { getOne } from '@/lib/db';
import { Artist } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const artist = await getOne<Artist>(
      'SELECT * FROM artists WHERE slug = $1',
      [slug]
    );

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Artist detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}
