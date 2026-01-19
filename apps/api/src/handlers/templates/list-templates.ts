/**
 * List Templates Handler
 *
 * GET /api/templates?category=tournament
 *
 * This handler only deals with HTTP concerns:
 * - Parse request parameters
 * - Call repository
 * - Format response
 *
 * All database logic lives in @bjj-poster/db
 */

import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { db, type TemplateCategory } from '@bjj-poster/db';

// Valid category values for validation
const VALID_CATEGORIES: TemplateCategory[] = [
  'tournament',
  'promotion',
  'gym',
  'social',
];

function isValidCategory(value: string): value is TemplateCategory {
  return VALID_CATEGORIES.includes(value as TemplateCategory);
}

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  console.log('ListTemplates handler invoked', {
    requestId,
    queryParams: event.queryStringParameters,
  });

  try {
    // Parse optional category filter
    const categoryParam = event.queryStringParameters?.category;
    let category: TemplateCategory | undefined;

    if (categoryParam) {
      if (!isValidCategory(categoryParam)) {
        return createResponse(400, {
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        });
      }
      category = categoryParam;
    }

    // Delegate to repository - no DB logic here!
    const templates = await db.templates.list(category);

    // Sort by category alphabetically
    templates.sort((a, b) => a.category.localeCompare(b.category));

    console.log('Templates retrieved', {
      requestId,
      count: templates.length,
      category: category || 'all',
    });

    return createResponse(200, {
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('ListTemplates handler failed', { requestId, error });

    return createResponse(500, {
      message: 'Failed to retrieve templates',
    });
  }
};
