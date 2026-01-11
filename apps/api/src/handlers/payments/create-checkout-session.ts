import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createCheckoutSchema } from './types.js';
import { getPriceId } from './price-config.js';

function createResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  console.log('CreateCheckoutSession handler invoked', { requestId });

  // Check authentication
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return createResponse(401, { message: 'Unauthorized' });
  }

  // Parse and validate body
  if (!event.body) {
    return createResponse(400, { message: 'Request body is required' });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    return createResponse(400, { message: 'Invalid JSON body' });
  }

  const validation = createCheckoutSchema.safeParse(parsedBody);
  if (!validation.success) {
    return createResponse(400, {
      message: 'Invalid request',
      errors: validation.error.issues,
    });
  }

  const { tier, interval } = validation.data;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });

    const priceId = getPriceId(tier, interval);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: `${appUrl}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
      metadata: {
        userId,
        tier,
        interval,
      },
    });

    console.log('Checkout session created', {
      requestId,
      sessionId: session.id,
      tier,
      interval,
    });

    return createResponse(200, { url: session.url });
  } catch (error) {
    console.error('Failed to create checkout session', { requestId, error });

    if (error instanceof Error && error.message.includes('Missing price ID')) {
      return createResponse(400, { message: error.message });
    }

    return createResponse(500, { message: 'Failed to create checkout session' });
  }
};
