import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { getAll, insert } from '@/lib/db';

async function getHandler(request: NextRequest) {
  try {
    const artists = await getAll(
      'SELECT * FROM artists ORDER BY created_at DESC'
    );

    return NextResponse.json(artists);
  } catch (error) {
    console.error('Get artists error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, bio, imageUrl } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const artist = await insert(
      `INSERT INTO artists (name, slug, bio, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, bio || null, imageUrl || null]
    );

    return NextResponse.json(artist, { status: 201 });
  } catch (error: any) {
    console.error('Create artist error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Artist with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
