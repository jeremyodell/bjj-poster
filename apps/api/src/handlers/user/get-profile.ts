/**
 * Get User Profile Handler
 *
 * GET /api/user/profile
 *
 * Returns authenticated user's profile data including subscription
 * tier and quota information.
 *
 * Security: This handler requires a valid Cognito JWT token. The API Gateway
 * Cognito authorizer validates the token before invoking this handler. The
 * authorizer populates event.requestContext.authorizer.claims with decoded
 * JWT claims including 'sub' (userId) and 'email'.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createRequestLogger } from '@bjj-poster/core';
import { db } from '@bjj-poster/db';
import type { GetProfileResponse } from './types.js';

/**
 * Creates a standardized API Gateway response with CORS headers.
 * @param statusCode - HTTP status code
 * @param body - Response body to be JSON stringified
 * @returns API Gateway proxy result with Content-Type and CORS headers
 */
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

  // Extract and validate userId from auth context.
  // The API Gateway Cognito authorizer validates the JWT and populates claims.
  // We perform runtime type checking as defense-in-depth since claims are typed as 'any'.
  const userIdClaim = event.requestContext.authorizer?.claims?.sub;
  const emailClaim = event.requestContext.authorizer?.claims?.email;

  if (!userIdClaim || typeof userIdClaim !== 'string') {
    log.info('Unauthorized request - missing or invalid userId', {
      hasUserId: !!userIdClaim,
      userIdType: typeof userIdClaim,
    });
    return createResponse(401, { message: 'Unauthorized' });
  }

  const userId = userIdClaim;
  const email = typeof emailClaim === 'string' ? emailClaim : undefined;

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

    // Determine email with fallback. Empty email is acceptable because:
    // 1. New users (first login) may not have a DB record yet
    // 2. The JWT claim may be missing if Cognito is configured without email
    // 3. The frontend should gracefully handle empty email (show "Not set")
    // We log a warning to help identify data quality issues.
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
