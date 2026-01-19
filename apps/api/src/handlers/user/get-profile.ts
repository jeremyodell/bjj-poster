/**
 * Get User Profile Handler
 *
 * GET /api/user/profile
 *
 * Returns authenticated user's profile data including subscription
 * tier and quota information.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '@bjj-poster/db';
import type { GetProfileResponse } from './types.js';

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
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

  // Extract userId from auth context
  const userId = event.requestContext.authorizer?.claims?.sub;
  const email = event.requestContext.authorizer?.claims?.email;

  if (!userId) {
    console.log('Unauthorized request', { requestId });
    return createResponse(401, { message: 'Unauthorized' });
  }

  console.log('GetProfile handler invoked', { requestId, userId });

  try {
    // Fetch user and usage in parallel
    const [user, usage] = await Promise.all([
      db.users.getById(userId),
      db.users.getUsage(userId),
    ]);

    // Fire-and-forget: update lastActiveAt for existing users
    if (user) {
      db.users.updateLastActiveAt(userId).catch((err) => {
        console.warn('Failed to update lastActiveAt', { requestId, userId, error: err });
      });
    }

    const response: GetProfileResponse = {
      user: {
        id: userId,
        email: user?.email || email || '',
        name: user?.name,
      },
      subscription: {
        tier: user?.subscriptionTier || 'free',
      },
      quota: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        resetsAt: usage.resetsAt,
      },
    };

    console.log('Profile retrieved', { requestId, userId, tier: response.subscription.tier });

    return createResponse(200, response);
  } catch (error) {
    console.error('GetProfile handler failed', { requestId, userId, error });
    return createResponse(500, { message: 'Failed to retrieve profile' });
  }
};
