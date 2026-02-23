import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getOne } from '@/lib/db';
import { Event, Ticket } from '@/lib/types';
import { verifyToken } from '@/lib/userAuth';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // ユーザー認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ログインが必要です', requiresAuth: true },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyToken(token);

    if (!userPayload) {
      return NextResponse.json(
        { error: 'ログインセッションが無効です', requiresAuth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId, eventSlug } = body;

    if (!ticketId || !eventSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get event details
    const event = await getOne<Event>(
      'SELECT * FROM events WHERE slug = $1',
      [eventSlug]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get ticket details
    const ticket = await getOne<Ticket>(
      `
      SELECT * FROM tickets
      WHERE id = $1 AND event_id = $2 AND is_active = true
    `,
      [ticketId, event.id]
    );

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check stock
    if (ticket.stock !== null && ticket.sold >= ticket.stock) {
      return NextResponse.json(
        { error: 'Ticket sold out' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: ticket.currency,
            product_data: {
              name: `${event.title} - ${ticket.name}`,
              description: ticket.description || undefined,
              images: event.thumbnail_url ? [event.thumbnail_url] : undefined,
            },
            unit_amount: ticket.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events/${eventSlug}`,
      metadata: {
        event_id: event.id.toString(),
        ticket_id: ticket.id.toString(),
        event_slug: eventSlug,
        user_id: userPayload.userId.toString(), // ユーザーIDを追加
        user_email: userPayload.email,
      },
      customer_email: userPayload.email, // Stripeの顧客メールを設定
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
