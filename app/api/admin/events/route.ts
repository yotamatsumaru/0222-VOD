import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { getAll, insert, update } from '@/lib/db';

async function getHandler(request: NextRequest) {
  try {
    const events = await getAll(
      `SELECT e.*, a.name as artist_name
       FROM events e
       LEFT JOIN artists a ON e.artist_id = a.id
       ORDER BY e.created_at DESC`
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artistId,
      title,
      slug,
      description,
      thumbnailUrl,
      streamUrl,
      archiveUrl,
      status,
      startTime,
      endTime,
    } = body;

    console.log('POST /api/admin/events - Request body:', body);

    if (!artistId || !title || !slug) {
      console.error('POST /api/admin/events - Missing required fields:', { artistId, title, slug });
      return NextResponse.json(
        { error: 'Missing required fields: artistId, title, and slug are required' },
        { status: 400 }
      );
    }

    console.log('POST /api/admin/events - Inserting event into database...');

    const event = await insert(
      `INSERT INTO events (
        artist_id, title, slug, description, thumbnail_url,
        stream_url, archive_url, status, start_time, end_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        artistId,
        title,
        slug,
        description || null,
        thumbnailUrl || null,
        streamUrl || null,
        archiveUrl || null,
        status || 'upcoming',
        startTime || null,
        endTime || null,
      ]
    );

    console.log('POST /api/admin/events - Event created successfully:', event);

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/events - Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Event with this slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create event',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
