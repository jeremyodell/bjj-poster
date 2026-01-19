/**
 * Get User Posters Handler
 *
 * GET /api/posters?limit=20&cursor=...&beltRank=purple
 *
 * Returns paginated list of user's posters with cursor-based pagination.
 * Supports optional filtering by belt rank.
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '@bjj-poster/db';
import type { BeltRank } from '@bjj-poster/db';
import {
  type PosterListItem,
  type GetUserPostersResponse,
  VALID_BELT_RANKS,
  isValidBeltRank,
} from './types.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

// For now, generate simple URLs. In production, use signed CloudFront URLs.
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://cdn.bjjposter.app';

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

function generateImageUrl(imageKey: string): string {
  return `${CDN_BASE_URL}/${imageKey}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // Extract userId from auth context
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    console.log('Unauthorized request', { requestId });
    return createResponse(401, { message: 'Unauthorized' });
  }

  console.log('GetUserPosters handler invoked', {
    requestId,
    userId,
    queryParams: event.queryStringParameters,
  });

  try {
    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse limit
    let limit = DEFAULT_LIMIT;
    if (queryParams.limit) {
      const parsedLimit = parseInt(queryParams.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < MIN_LIMIT || parsedLimit > MAX_LIMIT) {
        return createResponse(400, {
          message: `Invalid limit. Must be between ${MIN_LIMIT} and ${MAX_LIMIT}.`,
        });
      }
      limit = parsedLimit;
    }

    // Parse cursor (optional)
    const cursor = queryParams.cursor || undefined;

    // Parse and validate beltRank filter (optional)
    let beltRank: BeltRank | undefined;
    if (queryParams.beltRank) {
      if (!isValidBeltRank(queryParams.beltRank)) {
        return createResponse(400, {
          message: `Invalid beltRank. Must be one of: ${VALID_BELT_RANKS.join(', ')}`,
        });
      }
      beltRank = queryParams.beltRank;
    }

    // Call repository
    const result = await db.posters.getByUserIdPaginated(userId, {
      limit,
      cursor,
      beltRank,
    });

    // Transform to response format with URLs
    const posters: PosterListItem[] = result.items.map((poster) => ({
      id: poster.posterId,
      templateId: poster.templateId,
      athleteName: poster.athleteName,
      teamName: poster.teamName,
      beltRank: poster.beltRank,
      tournamentName: poster.tournamentName,
      tournamentDate: poster.tournamentDate,
      tournamentLocation: poster.tournamentLocation,
      achievement: poster.achievement,
      status: poster.status,
      imageUrl: generateImageUrl(poster.imageKey),
      thumbnailUrl: generateImageUrl(poster.thumbnailKey),
      createdAt: poster.createdAt,
    }));

    const response: GetUserPostersResponse = {
      posters,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
      },
      count: posters.length,
    };

    console.log('Posters retrieved', {
      requestId,
      userId,
      count: posters.length,
      hasMore: response.pagination.hasMore,
    });

    return createResponse(200, response);
  } catch (error) {
    console.error('GetUserPosters handler failed', { requestId, userId, error });
    return createResponse(500, { message: 'Failed to retrieve posters' });
  }
};
