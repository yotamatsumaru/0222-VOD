import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuthNew';
import { getAll, insert } from '@/lib/db';

async function getHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  try {
    // Artist Adminの場合、自分のアーティストのイベントのみ取得
    const query = adminInfo.isSuperAdmin
      ? `SELECT e.*, a.name as artist_name
         FROM events e
         LEFT JOIN artists a ON e.artist_id = a.id
         ORDER BY e.created_at DESC`
      : `SELECT e.*, a.name as artist_name
         FROM events e
         LEFT JOIN artists a ON e.artist_id = a.id
         WHERE e.artist_id = $1
         ORDER BY e.created_at DESC`;
    
    const params = adminInfo.isSuperAdmin ? [] : [adminInfo.admin.artistId];
    const events = await getAll(query, params);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

async function postHandler(
  request: NextRequest,
  adminInfo: { admin: any; isSuperAdmin: boolean }
) {
  try {
    const body = await request.json();
    const {
      artistId,
      artist_id,
      title,
      slug,
      description,
      thumbnail_url,
      stream_url,
      archive_url,
      status,
      startTime,
      start_time,
      endTime,
      end_time,
    } = body;

    // Support both camelCase and snake_case
    const finalArtistId = artistId || artist_id;
    const finalThumbnailUrl = thumbnail_url;
    const finalStreamUrl = stream_url;
    const finalArchiveUrl = archive_url;
    const finalStartTime = startTime || start_time;
    const finalEndTime = endTime || end_time;

    console.log('POST /api/admin/events - Request body:', body);

    if (!finalArtistId || !title || !slug) {
      console.error('POST /api/admin/events - Missing required fields:', { finalArtistId, title, slug });
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
        finalArtistId,
        title,
        slug,
        description || null,
        finalThumbnailUrl || null,
        finalStreamUrl || null,
        finalArchiveUrl || null,
        status || 'upcoming',
        finalStartTime || null,
        finalEndTime || null,
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

export const GET = requireAdmin(getHandler);
export const POST = requireAdmin(postHandler);
