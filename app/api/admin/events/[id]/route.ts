import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/adminAuth';
import { update, remove, getOne } from '@/lib/db';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const event = await update(
      `UPDATE events SET
        artist_id = COALESCE($1, artist_id),
        title = COALESCE($2, title),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        thumbnail_url = COALESCE($5, thumbnail_url),
        stream_url = COALESCE($6, stream_url),
        archive_url = COALESCE($7, archive_url),
        status = COALESCE($8, status),
        start_time = COALESCE($9, start_time),
        end_time = COALESCE($10, end_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        finalArtistId,
        title,
        slug,
        description,
        finalThumbnailUrl,
        finalStreamUrl,
        finalArchiveUrl,
        status,
        finalStartTime,
        finalEndTime,
        parseInt(id),
      ]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Update event error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Event with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await remove('DELETE FROM events WHERE id = $1', [
      parseInt(id),
    ]);

    if (!deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

export const PATCH = requireAuth(patchHandler);
export const DELETE = requireAuth(deleteHandler);
