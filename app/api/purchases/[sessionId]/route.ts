import { NextResponse } from 'next/server';
import { getOne } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const purchase = await getOne(
      `
      SELECT 
        p.*,
        e.title as event_title,
        e.slug as event_slug,
        t.name as ticket_name
      FROM purchases p
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN tickets t ON p.ticket_id = t.id
      WHERE p.stripe_session_id = $1
    `,
      [sessionId]
    );

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eventTitle: purchase.event_title,
      eventSlug: purchase.event_slug,
      ticketName: purchase.ticket_name,
      amount: purchase.amount,
      currency: purchase.currency,
      accessToken: purchase.access_token,
      customerEmail: purchase.customer_email,
    });
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase' },
      { status: 500 }
    );
  }
}
