/**
 * Generate Poster Handler
 *
 * POST /api/posters/generate
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';
import { composePoster, initBundledFonts } from '@bjj-poster/core';
import { db } from '@bjj-poster/db';
import type { BeltRank } from '@bjj-poster/db';
import { parseMultipart, parseMultipartBase64 } from '../../lib/multipart.js';
import { uploadMultipleToS3, generatePosterKeys } from '../../lib/s3.js';
import { generatePosterSchema } from './types.js';
import type { GeneratePosterResponse, QuotaExceededResponse } from './types.js';

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 560;

// Track font initialization
let fontsInitialized = false;

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(
  statusCode: number,
  message: string,
  code: string
): APIGatewayProxyResult {
  return createResponse(statusCode, { message, code });
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  console.log('Generate poster handler invoked', { requestId });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // 1. Extract userId from JWT
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  if (!userId) {
    return createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED');
  }

  // 2. Check quota BEFORE parsing multipart (fail fast)
  const usageCheck = await db.users.getUsage(userId);
  if (!usageCheck.allowed) {
    const response: QuotaExceededResponse = {
      message: 'Monthly poster limit reached',
      code: 'QUOTA_EXCEEDED',
      usage: {
        used: usageCheck.used,
        limit: usageCheck.limit,
        remaining: 0,
        resetsAt: usageCheck.resetsAt,
      },
    };
    return createResponse(403, response);
  }

  // 3. Parse multipart form data
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required', 'MISSING_BODY');
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return createErrorResponse(400, 'Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE');
  }

  let parsed;
  try {
    parsed = event.isBase64Encoded
      ? await parseMultipartBase64(event.body, contentType)
      : await parseMultipart(event.body, contentType);
  } catch (error) {
    console.error('Multipart parsing error', { requestId, error });
    if (error instanceof Error && error.message.includes('exceeds maximum size')) {
      return createErrorResponse(413, 'Photo exceeds 10MB limit', 'PHOTO_TOO_LARGE');
    }
    return createErrorResponse(400, 'Invalid multipart form data', 'INVALID_MULTIPART');
  }

  // 4. Validate photo
  if (!parsed.file) {
    return createErrorResponse(400, 'Photo is required', 'MISSING_PHOTO');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMimeTypes.includes(parsed.file.mimeType)) {
    return createErrorResponse(400, 'Photo must be JPEG or PNG', 'INVALID_PHOTO');
  }

  // 5. Validate fields with Zod
  const validation = generatePosterSchema.safeParse(parsed.fields);
  if (!validation.success) {
    return createResponse(400, {
      message: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: validation.error.issues,
    });
  }

  const input = validation.data;

  try {
    // Initialize fonts once (cold start)
    if (!fontsInitialized) {
      console.log('Initializing bundled fonts', { requestId });
      await initBundledFonts();
      fontsInitialized = true;
    }

    // 6. Generate poster using composePoster
    console.log('Composing poster', { requestId, templateId: input.templateId });
    const posterResult = await composePoster({
      templateId: input.templateId,
      athletePhoto: parsed.file.buffer,
      data: {
        athleteName: input.athleteName,
        teamName: input.teamName || '',
        achievement: input.achievement || '',
        tournamentName: input.tournamentName,
        date: input.tournamentDate,
        location: input.tournamentLocation || '',
      },
      output: {
        format: 'jpeg',
        quality: 90,
      },
    });

    // 7. Generate thumbnail
    console.log('Generating thumbnail', { requestId });
    const thumbnail = await sharp(posterResult.buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 8. Save to DynamoDB first to get the posterId
    console.log('Saving to DynamoDB', { requestId });
    const poster = await db.posters.create({
      userId,
      templateId: input.templateId,
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank as BeltRank,
      tournamentName: input.tournamentName,
      tournamentDate: input.tournamentDate,
      tournamentLocation: input.tournamentLocation,
      achievement: input.achievement,
      // Temporary keys - will be updated after S3 upload
      imageKey: '',
      thumbnailKey: '',
      uploadKey: '',
    });

    // 9. Upload to S3 in parallel using the generated posterId
    const keys = generatePosterKeys(userId, poster.posterId);

    console.log('Uploading to S3', { requestId, posterId: poster.posterId });
    const [posterUpload, thumbnailUpload] = await uploadMultipleToS3([
      { key: keys.imageKey, buffer: posterResult.buffer, contentType: 'image/jpeg' },
      { key: keys.thumbnailKey, buffer: thumbnail, contentType: 'image/jpeg' },
      { key: keys.uploadKey, buffer: parsed.file.buffer, contentType: parsed.file.mimeType },
    ]);

    // 10. Increment usage (after successful save)
    const finalUsage = await db.users.checkAndIncrementUsage(userId);

    // 11. Return success response
    const response: GeneratePosterResponse = {
      poster: {
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
        imageUrl: posterUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        createdAt: poster.createdAt,
      },
      usage: {
        used: finalUsage.used,
        limit: finalUsage.limit,
        remaining: finalUsage.remaining,
      },
    };

    console.log('Poster generated successfully', { requestId, posterId: poster.posterId });
    return createResponse(201, response);
  } catch (error) {
    console.error('Poster generation failed', { requestId, error });
    return createErrorResponse(500, 'Failed to generate poster', 'GENERATION_FAILED');
  }
};
