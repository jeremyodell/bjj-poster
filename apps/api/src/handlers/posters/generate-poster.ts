/**
 * Generate Poster Handler
 *
 * POST /api/posters/generate
 *
 * Flow:
 * 1. Validate auth and parse request
 * 2. Validate image format with sharp (security)
 * 3. Atomically check and reserve quota (prevents race condition)
 * 4. Generate poster and thumbnail
 * 5. Upload to S3
 * 6. Save to DynamoDB with S3 keys
 * 7. On failure, rollback quota and cleanup S3
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import {
  composePoster,
  initBundledFonts,
  TemplateNotFoundError,
  FontLoadError,
  ExternalServiceError,
} from '@bjj-poster/core';
import { db } from '@bjj-poster/db';
import type { BeltRank } from '@bjj-poster/db';
import { parseMultipart, parseMultipartBase64 } from '../../lib/multipart.js';
import { uploadMultipleToS3, generatePosterKeys, deleteFromS3 } from '../../lib/s3.js';
import { generatePosterSchema } from './types.js';
import type { GeneratePosterResponse, QuotaExceededResponse } from './types.js';

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 560;
const THUMBNAIL_QUALITY = 80;
const POSTER_QUALITY = 90;

// Track font initialization
let fontsInitialized = false;

// Get allowed origins from environment or use restrictive default
const ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || 'https://bjj-poster.com';

/**
 * Sanitize text input to prevent XSS in rendered output.
 * Escapes HTML special characters.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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

/**
 * Validate image format using sharp metadata (not just MIME type header)
 */
async function validateImageFormat(buffer: Buffer): Promise<{ valid: boolean; format?: string; error?: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const allowedFormats = ['jpeg', 'png'];

    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      return { valid: false, error: `Invalid image format: ${metadata.format || 'unknown'}` };
    }

    return { valid: true, format: metadata.format };
  } catch {
    return { valid: false, error: 'Unable to read image file' };
  }
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
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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

  // 2. Parse multipart form data
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

  // 3. Validate photo exists
  if (!parsed.file) {
    return createErrorResponse(400, 'Photo is required', 'MISSING_PHOTO');
  }

  // 4. Validate actual image format with sharp (security - don't trust MIME header)
  const imageValidation = await validateImageFormat(parsed.file.buffer);
  if (!imageValidation.valid) {
    console.warn('Invalid image rejected', {
      requestId,
      userId,
      error: imageValidation.error,
      claimedMimeType: parsed.file.mimeType,
      fileSize: parsed.file.buffer.length,
    });
    return createErrorResponse(400, 'Photo must be a valid JPEG or PNG image', 'INVALID_PHOTO');
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

  // 6. Atomically check and reserve quota BEFORE any expensive operations
  // This prevents race conditions where concurrent requests could bypass limits
  const usageResult = await db.users.checkAndIncrementUsage(userId);
  if (!usageResult.allowed) {
    const response: QuotaExceededResponse = {
      message: 'Monthly poster limit reached',
      code: 'QUOTA_EXCEEDED',
      usage: {
        used: usageResult.used,
        limit: usageResult.limit,
        remaining: 0,
        resetsAt: usageResult.resetsAt,
      },
    };
    return createResponse(403, response);
  }

  // From this point, we've consumed quota - must rollback on failure
  let quotaConsumed = true;
  let s3Keys: { imageKey: string; thumbnailKey: string; uploadKey: string } | null = null;

  try {
    // 7. Initialize fonts once (cold start)
    if (!fontsInitialized) {
      console.log('Initializing bundled fonts', { requestId });
      await initBundledFonts();
      fontsInitialized = true;
    }

    // 8. Sanitize text inputs to prevent XSS in rendered output
    const sanitizedData = {
      athleteName: sanitizeText(input.athleteName),
      teamName: input.teamName ? sanitizeText(input.teamName) : '',
      achievement: input.achievement ? sanitizeText(input.achievement) : '',
      tournamentName: sanitizeText(input.tournamentName),
      date: sanitizeText(input.tournamentDate),
      location: input.tournamentLocation ? sanitizeText(input.tournamentLocation) : '',
    };

    // 9. Generate poster using composePoster
    console.log('Composing poster', { requestId, templateId: input.templateId });
    const posterResult = await composePoster({
      templateId: input.templateId,
      athletePhoto: parsed.file.buffer,
      data: sanitizedData,
      output: {
        format: 'jpeg',
        quality: POSTER_QUALITY,
      },
    });

    // 10. Generate thumbnail
    console.log('Generating thumbnail', { requestId });
    const thumbnail = await sharp(posterResult.buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    // 11. Generate poster ID and S3 keys BEFORE any writes
    const posterId = `pstr_${nanoid(12)}`;
    const keys = generatePosterKeys(userId, posterId);
    s3Keys = keys; // Track for cleanup on failure

    // 12. Upload to S3 first (if this fails, we haven't touched the DB yet)
    console.log('Uploading to S3', { requestId, posterId });
    const [posterUpload, thumbnailUpload] = await uploadMultipleToS3([
      { key: keys.imageKey, buffer: posterResult.buffer, contentType: 'image/jpeg' },
      { key: keys.thumbnailKey, buffer: thumbnail, contentType: 'image/jpeg' },
      { key: keys.uploadKey, buffer: parsed.file.buffer, contentType: `image/${imageValidation.format}` },
    ]);

    // 13. Save to DynamoDB with correct S3 keys
    console.log('Saving to DynamoDB', { requestId, posterId });
    const poster = await db.posters.create({
      posterId,
      userId,
      templateId: input.templateId,
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank as BeltRank,
      tournamentName: input.tournamentName,
      tournamentDate: input.tournamentDate,
      tournamentLocation: input.tournamentLocation,
      achievement: input.achievement,
      imageKey: keys.imageKey,
      thumbnailKey: keys.thumbnailKey,
      uploadKey: keys.uploadKey,
    });

    // Success - quota was correctly consumed, S3 objects are valid
    quotaConsumed = false;
    s3Keys = null; // No cleanup needed

    // 14. Return success response
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
        used: usageResult.used,
        limit: usageResult.limit,
        remaining: usageResult.remaining,
      },
    };

    console.log('Poster generated successfully', { requestId, posterId: poster.posterId });
    return createResponse(201, response);
  } catch (error) {
    console.error('Poster generation failed', { requestId, error });

    // Rollback quota if we consumed it but failed
    if (quotaConsumed) {
      try {
        await db.users.decrementUsage(userId);
        console.log('Quota rolled back after failure', { requestId, userId });
      } catch (rollbackError) {
        console.error('Failed to rollback quota', { requestId, userId, error: rollbackError });
      }
    }

    // Cleanup orphaned S3 objects if DB write failed after S3 upload
    if (s3Keys) {
      console.warn('Cleaning up orphaned S3 objects after DB failure', { requestId, keys: s3Keys });
      try {
        await Promise.all([
          deleteFromS3(s3Keys.imageKey),
          deleteFromS3(s3Keys.thumbnailKey),
          deleteFromS3(s3Keys.uploadKey),
        ]);
        console.log('S3 cleanup completed', { requestId });
      } catch (cleanupError) {
        // Log but continue - S3 lifecycle rules can handle orphaned objects
        console.error('Failed to cleanup S3 objects', { requestId, error: cleanupError });
      }
    }

    // Return appropriate error based on failure type using typed errors
    if (error instanceof TemplateNotFoundError) {
      return createErrorResponse(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }
    if (error instanceof FontLoadError) {
      return createErrorResponse(500, 'Failed to initialize fonts', 'FONT_INIT_FAILED');
    }
    if (error instanceof ExternalServiceError) {
      return createErrorResponse(500, 'Failed to upload poster', 'STORAGE_ERROR');
    }

    // Fallback for untyped errors (legacy compatibility)
    if (error instanceof Error) {
      if (error.message.includes('S3') || error.message.includes('upload')) {
        return createErrorResponse(500, 'Failed to upload poster', 'STORAGE_ERROR');
      }
      if (error.message.includes('DynamoDB') || error.message.includes('database')) {
        return createErrorResponse(500, 'Failed to save poster', 'DATABASE_ERROR');
      }
    }

    return createErrorResponse(500, 'Failed to generate poster', 'GENERATION_FAILED');
  }
};
