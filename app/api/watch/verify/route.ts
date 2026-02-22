import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
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

    // Verify JWT token
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get event details
    const event = await getOne(
      'SELECT id, title, slug, status FROM events WHERE slug = $1',
      [eventSlug]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify purchase matches event
    if (payload.eventId !== event.id) {
      return NextResponse.json(
        { error: 'Token not valid for this event' },
        { status: 403 }
      );
    }

    // Check if purchase exists and is valid
    const purchase = await getOne(
      `
      SELECT id, status, access_token, token_expires_at
      FROM purchases
      WHERE id = $1 AND access_token = $2
    `,
      [payload.purchaseId, token]
    );

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json(
        { error: 'Purchase is not completed' },
        { status: 403 }
      );
    }

    // Check token expiration
    if (purchase.token_expires_at) {
      const expiresAt = new Date(purchase.token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
