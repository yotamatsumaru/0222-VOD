import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { insert, update, getOne } from '@/lib/db';
import { generateAccessToken } from '@/lib/auth';
import { generatePurchaseConfirmationEmail, sendEmail } from '@/lib/email';
import Stripe from 'stripe';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const eventId = parseInt(session.metadata?.event_id || '0');
        const ticketId = parseInt(session.metadata?.ticket_id || '0');
        const userId = parseInt(session.metadata?.user_id || '0');
        
        if (!eventId || !ticketId) {
          console.error('Missing metadata in session:', session.id);
          break;
        }

        // Create purchase record
        const purchase = await insert(
          `
          INSERT INTO purchases (
            event_id, ticket_id, user_id, stripe_session_id,
            stripe_payment_intent, customer_email, customer_name,
            amount, currency, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
          [
            eventId,
            ticketId,
            userId || null,
            session.id,
            session.payment_intent,
            session.customer_details?.email || '',
            session.customer_details?.name || '',
            session.amount_total || 0,
            session.currency || 'jpy',
            'completed',
          ]
        );

        // Generate access token
        const accessToken = generateAccessToken({
          purchaseId: purchase.id,
          eventId: eventId,
          email: session.customer_details?.email || '',
        });

        // Update purchase with access token
        await update(
          `
          UPDATE purchases
          SET access_token = $1,
              token_expires_at = NOW() + INTERVAL '30 days'
          WHERE id = $2
        `,
          [accessToken, purchase.id]
        );

        // Increment sold count
        await update(
          'UPDATE tickets SET sold = sold + 1 WHERE id = $1',
          [ticketId]
        );

        // 購入確認メール送信（非同期、エラーでも決済は成功扱い）
        try {
          const eventSlug = session.metadata?.event_slug || '';
          const eventData: any = await getOne(
            'SELECT title FROM events WHERE id = $1',
            [eventId]
          );
          const ticketData: any = await getOne(
            'SELECT name FROM tickets WHERE id = $1',
            [ticketId]
          );
          
          if (eventData && ticketData && session.customer_details?.email) {
            const purchaseEmail = generatePurchaseConfirmationEmail(
              session.customer_details?.name || '',
              session.customer_details.email,
              eventData.title,
              ticketData.name,
              session.amount_total || 0,
              session.currency || 'jpy',
              accessToken,
              eventSlug
            );
            
            await sendEmail(
              session.customer_details.email,
              `【購入完了】${eventData.title} - チケット購入が完了しました`,
              purchaseEmail
            );
          }
        } catch (emailError) {
          console.error('Failed to send purchase confirmation email:', emailError);
        }

        console.log('Purchase completed:', purchase.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;

        // Update purchase status to refunded
        await update(
          `
          UPDATE purchases
          SET status = 'refunded'
          WHERE stripe_payment_intent = $1
        `,
          [paymentIntent]
        );

        console.log('Purchase refunded:', paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
