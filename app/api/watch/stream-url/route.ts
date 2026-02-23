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
    
    // Priority: stream_url for live/upcoming, archive_url for archived
    if (event.status === 'live' || event.status === 'upcoming') {
      streamUrl = event.stream_url || event.archive_url;
    } else if (event.status === 'archived' || event.status === 'ended') {
      streamUrl = event.archive_url || event.stream_url;
    } else {
      // For draft or any other status, try both
      streamUrl = event.stream_url || event.archive_url;
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'ストリーミングURLが設定されていません。管理者にお問い合わせください。' },
        { status: 404 }
      );
    }

    // For now, return the URL directly without CloudFront signing
    // If CloudFront is configured in the future, use generateSignedUrl
    let finalUrl = streamUrl;
    try {
      // Only try to sign if CloudFront env vars are set
      if (process.env.CLOUDFRONT_KEY_PAIR_ID && process.env.CLOUDFRONT_PRIVATE_KEY) {
        finalUrl = generateSignedUrl(streamUrl, 3600); // 1 hour expiration
      }
    } catch (err) {
      console.log('CloudFront signing not configured, using direct URL');
    }

    return NextResponse.json({
      streamUrl: finalUrl,
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
