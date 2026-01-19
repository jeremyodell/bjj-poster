/**
 * Get User Profile Handler
 *
 * GET /api/user/profile
 *
 * Returns authenticated user's profile data including subscription
 * tier and quota information.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createRequestLogger } from '@bjj-poster/core';
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
  const log = createRequestLogger(requestId);

  // Extract userId from auth context
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  const email = event.requestContext.authorizer?.claims?.email as string | undefined;

  if (!userId) {
    log.info('Unauthorized request - missing userId');
    return createResponse(401, { message: 'Unauthorized' });
  }

  log.info('GetProfile handler invoked', { userId });

  try {
    // Fetch user and usage in parallel
    const [user, usage] = await Promise.all([
      db.users.getById(userId),
      db.users.getUsage(userId),
    ]);

    // Fire-and-forget: update lastActiveAt for existing users
    if (user) {
      db.users.updateLastActiveAt(userId).catch((err: unknown) => {
        log.warn('Failed to update lastActiveAt', { userId, error: err });
      });
    }

    // Determine email with fallback, warn if missing
    const userEmail = user?.email || email || '';
    if (!userEmail) {
      log.warn('User profile has no email', { userId });
    }

    const response: GetProfileResponse = {
      user: {
        id: userId,
        email: userEmail,
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

    log.info('Profile retrieved', { userId, tier: response.subscription.tier });

    return createResponse(200, response);
  } catch (error) {
    log.error('GetProfile handler failed', { userId, error });
    return createResponse(500, { message: 'Failed to retrieve profile' });
  }
};
