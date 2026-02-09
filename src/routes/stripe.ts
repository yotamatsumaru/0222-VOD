import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import { getStripe, createCheckoutSession, constructWebhookEvent } from '../lib/stripe';
import { Database } from '../lib/db';
import { generateAccessToken } from '../lib/auth';

const stripe = new Hono<{ Bindings: Bindings }>();

// Create checkout session
const checkoutSchema = z.object({
  ticketId: z.number(),
  eventId: z.number(),
});

stripe.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  try {
    const { ticketId, eventId } = c.req.valid('json');
    const stripeClient = getStripe(c.env.STRIPE_SECRET_KEY);
    const db = new Database(c.env.DB);

    // Get ticket and event info
    const ticket = await db.getTicketById(ticketId);
    const event = await db.getEventById(eventId);

    if (!ticket || !event) {
      return c.json({ error: 'Ticket or event not found' }, 404);
    }

    // Check stock availability
    if (ticket.stock !== null && ticket.sold_count >= ticket.stock) {
      return c.json({ error: 'Ticket sold out' }, 400);
    }

    // Create checkout session
    const session = await createCheckoutSession(stripeClient, {
      ticketId: ticket.id,
      ticketName: ticket.name,
      price: ticket.price,
      currency: ticket.currency,
      eventId: event.id,
      eventTitle: event.title,
      successUrl: `${new URL(c.req.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${new URL(c.req.url).origin}/events/${event.slug}`,
    });

    return c.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return c.json({ error: 'Failed to create checkout session', details: error.message }, 500);
  }
});

// Webhook handler
stripe.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'No signature' }, 400);
    }

    const body = await c.req.text();
    const stripeClient = getStripe(c.env.STRIPE_SECRET_KEY);
    
    const event = await constructWebhookEvent(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
      stripeClient
    );

    const db = new Database(c.env.DB);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        // Get metadata
        const eventId = parseInt(session.metadata.event_id);
        const ticketId = parseInt(session.metadata.ticket_id);

        // Check if purchase already exists
        const existingPurchase = await db.getPurchaseByCheckoutSession(session.id);
        if (existingPurchase) {
          console.log('Purchase already exists:', session.id);
          break;
        }

        // Generate access token
        const accessToken = await generateAccessToken(
          {
            purchaseId: 0, // Will be updated after insert
            eventId: eventId,
            customerId: session.customer || session.customer_details?.email || '',
            email: session.customer_details?.email || '',
          },
          c.env.JWT_SECRET,
          86400 * 365 // 1 year
        );

        const expiresAt = new Date(Date.now() + 86400 * 365 * 1000).toISOString();

        // Create purchase record
        await db.createPurchase({
          event_id: eventId,
          ticket_id: ticketId,
          stripe_customer_id: session.customer || session.customer_details?.email || '',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          customer_email: session.customer_details?.email || '',
          customer_name: session.customer_details?.name || '',
          amount: session.amount_total,
          currency: session.currency,
          status: 'completed',
          access_token: accessToken,
          access_expires_at: expiresAt,
        });

        // Increment sold count
        await db.incrementTicketSoldCount(ticketId);

        console.log('Purchase completed:', session.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntent = charge.payment_intent;

        // Update purchase status to refunded
        // Note: You might need to add a method to find purchase by payment_intent_id
        console.log('Charge refunded:', paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook handler failed', details: error.message }, 400);
  }
});

// Get checkout session status
stripe.get('/checkout/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const stripeClient = getStripe(c.env.STRIPE_SECRET_KEY);
    
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    const db = new Database(c.env.DB);
    const purchase = await db.getPurchaseByCheckoutSession(sessionId);

    return c.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      purchase: purchase,
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return c.json({ error: 'Failed to retrieve session', details: error.message }, 500);
  }
});

export default stripe;
