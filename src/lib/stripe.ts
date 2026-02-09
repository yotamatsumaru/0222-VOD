import Stripe from 'stripe';

export function getStripe(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

export async function createCheckoutSession(
  stripe: Stripe,
  params: {
    ticketId: number;
    ticketName: string;
    price: number;
    currency: string;
    eventId: number;
    eventTitle: string;
    successUrl: string;
    cancelUrl: string;
  }
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency,
          unit_amount: params.price,
          product_data: {
            name: params.ticketName,
            description: `${params.eventTitle}のチケット`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      event_id: params.eventId.toString(),
      ticket_id: params.ticketId.toString(),
    },
    customer_email: undefined, // Let customer enter email
  });

  return session;
}

export async function constructWebhookEvent(
  body: string,
  signature: string,
  webhookSecret: string,
  stripe: Stripe
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
