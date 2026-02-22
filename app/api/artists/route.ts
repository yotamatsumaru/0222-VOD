import { NextResponse } from 'next/server';
import { getAll } from '@/lib/db';
import { Artist } from '@/lib/types';

export async function GET() {
  try {
    const artists = await getAll<Artist>(`
      SELECT * FROM artists
      ORDER BY created_at DESC
    `);

    return NextResponse.json(artists);
  } catch (error) {
    console.error('Artists API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
