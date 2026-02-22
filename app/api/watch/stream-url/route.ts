import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { generateSignedUrl } from '@/lib/cloudfront';
import { getOne } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, eventSlug } = body;

    if (!token || !eventSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get event with stream URLs
    const event = await getOne(
      `
      SELECT id, title, slug, status, stream_url, archive_url
      FROM events
      WHERE slug = $1
    `,
      [eventSlug]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (payload.eventId !== event.id) {
      return NextResponse.json(
        { error: 'Token not valid for this event' },
        { status: 403 }
      );
    }

    // Determine which URL to use based on event status
    let streamUrl = null;
    if (event.status === 'live' && event.stream_url) {
      streamUrl = event.stream_url;
    } else if (
      (event.status === 'ended' || event.status === 'archived') &&
      event.archive_url
    ) {
      streamUrl = event.archive_url;
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'Stream URL not available' },
        { status: 404 }
      );
    }

    // Generate signed URL (if CloudFront is configured)
    const signedUrl = generateSignedUrl(streamUrl, 3600); // 1 hour expiration

    return NextResponse.json({
      streamUrl: signedUrl,
      status: event.status,
    });
  } catch (error) {
    console.error('Stream URL API error:', error);
    return NextResponse.json(
      { error: 'Failed to get stream URL' },
      { status: 500 }
    );
  }
}
