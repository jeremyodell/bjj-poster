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
import type { InitBundledFontsResult } from '@bjj-poster/core';
import { db } from '@bjj-poster/db';
import { parseMultipart, parseMultipartBase64 } from '../../lib/multipart.js';
import { uploadMultipleToS3, generatePosterKeys, deleteFromS3 } from '../../lib/s3.js';
import { generatePosterSchema } from './types.js';
import type { GeneratePosterResponse, QuotaExceededResponse } from './types.js';

// Thumbnail dimensions: 400x560 maintains 5:7 aspect ratio
// This matches the standard BJJ tournament poster template dimensions.
// All templates currently use 5:7 ratio (portrait orientation optimal for mobile).
//
// TODO(ODE-XXX): When adding templates with different aspect ratios, move these
// dimensions to template metadata. Each template should define its own thumbnail
// dimensions to preserve correct aspect ratio. Example template metadata structure:
//   { id: 'landscape-1', dimensions: { width: 1920, height: 1080 }, thumbnail: { width: 560, height: 315 } }
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 560;

// JPEG quality settings (1-100 scale)
// - THUMBNAIL_QUALITY: 80 balances ~50KB file size with acceptable visual quality for previews
// - POSTER_QUALITY: 90 provides near-lossless quality for final downloadable posters
const THUMBNAIL_QUALITY = 80;
const POSTER_QUALITY = 90;

// Maximum file size for uploaded photos (10MB)
// Must match MAX_FILE_SIZE in multipart.ts for consistent enforcement
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Promise-based lock for font initialization to prevent concurrent init calls.
// On failure, the promise is reset to null allowing retry on subsequent requests.
// Concurrent requests waiting on a failing promise will all get the error, but
// the next request will trigger a fresh initialization attempt.
let fontInitPromise: Promise<InitBundledFontsResult> | null = null;

// Allowed CORS origins from environment (comma-separated for multiple origins)
// Example: "https://bjj-poster.com,https://staging.bjj-poster.com"
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGIN || 'https://bjj-poster.com')
  .split(',')
  .map(origin => origin.trim());

/**
 * Get the appropriate CORS origin header for a request.
 * Returns the request origin if it's in the allowed list, otherwise returns the first allowed origin.
 * This enables multi-environment setups (dev/staging/prod) with different origins.
 */
function getCorsOrigin(requestOrigin: string | undefined): string {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  return ALLOWED_ORIGINS[0];
}

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
  body: unknown,
  corsOrigin: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

/**
 * Standard error response format for consistent client-side error handling.
 * All errors return { message, code } with an optional details field.
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  code: string,
  corsOrigin: string,
  details?: unknown
): APIGatewayProxyResult {
  const body: { message: string; code: string; details?: unknown } = { message, code };
  if (details !== undefined) {
    body.details = details;
  }
  return createResponse(statusCode, body, corsOrigin);
}

/**
 * Validate image format using sharp metadata (not just MIME type header).
 *
 * Supported formats:
 * - jpeg: Standard JPEG images
 * - png: PNG images with transparency support
 * - heif: HEIC/HEIF images (common on iOS devices) - sharp reads these via libvips
 *
 * Note: HEIF format is returned by sharp for HEIC files. The final poster is always
 * output as JPEG regardless of input format. Original uploads are stored in their
 * native format.
 */
async function validateImageFormat(buffer: Buffer): Promise<{ valid: boolean; format?: string; error?: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    // 'heif' is what sharp reports for HEIC files
    const allowedFormats = ['jpeg', 'png', 'heif'];

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

  // Get CORS origin for all responses (supports multi-origin configuration)
  const requestOrigin = event.headers.origin || event.headers.Origin;
  const corsOrigin = getCorsOrigin(requestOrigin);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // 1. Extract userId from JWT - use typeof check for type narrowing instead of cast
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (typeof userId !== 'string') {
    return createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED', corsOrigin);
  }
  // userId is now typed as string after the type guard

  // 2. Parse multipart form data
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required', 'MISSING_BODY', corsOrigin);
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return createErrorResponse(400, 'Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE', corsOrigin);
  }

  let parsed;
  try {
    parsed = event.isBase64Encoded
      ? await parseMultipartBase64(event.body, contentType)
      : await parseMultipart(event.body, contentType);
  } catch (error) {
    console.error('Multipart parsing error', { requestId, error });
    if (error instanceof Error) {
      if (error.message.includes('exceeds maximum size')) {
        return createErrorResponse(413, 'Photo exceeds 10MB limit', 'PHOTO_TOO_LARGE', corsOrigin);
      }
      if (error.message.includes('Invalid file type')) {
        return createErrorResponse(400, 'Photo must be JPEG, PNG, or HEIC format', 'INVALID_FILE_TYPE', corsOrigin);
      }
    }
    return createErrorResponse(400, 'Invalid multipart form data', 'INVALID_MULTIPART', corsOrigin);
  }

  // 3. Validate photo exists
  if (!parsed.file) {
    return createErrorResponse(400, 'Photo is required', 'MISSING_PHOTO', corsOrigin);
  }

  // 4. Explicit buffer size check (defense in depth against malformed requests)
  // Busboy enforces streaming limit, but this catches edge cases and provides clear error
  if (parsed.file.buffer.length > MAX_FILE_SIZE_BYTES) {
    return createErrorResponse(413, 'Photo exceeds 10MB limit', 'PHOTO_TOO_LARGE', corsOrigin);
  }

  // 5. Validate actual image format with sharp (security - don't trust MIME header)
  const imageValidation = await validateImageFormat(parsed.file.buffer);
  if (!imageValidation.valid) {
    console.warn('Invalid image rejected', {
      requestId,
      userId,
      error: imageValidation.error,
      claimedMimeType: parsed.file.mimeType,
      fileSize: parsed.file.buffer.length,
    });
    return createErrorResponse(400, 'Photo must be a valid JPEG or PNG image', 'INVALID_PHOTO', corsOrigin);
  }

  // 6. Validate fields with Zod
  const validation = generatePosterSchema.safeParse(parsed.fields);
  if (!validation.success) {
    return createErrorResponse(400, 'Invalid request', 'VALIDATION_ERROR', corsOrigin, validation.error.issues);
  }

  const input = validation.data;

  // 7. Atomically check and reserve quota BEFORE any expensive operations
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
    return createResponse(403, response, corsOrigin);
  }

  // From this point, we've consumed quota - must rollback on failure
  let quotaConsumed = true;
  let s3Keys: { imageKey: string; thumbnailKey: string; uploadKey: string } | null = null;

  try {
    // 8. Initialize fonts once (cold start) using Promise lock for thread safety.
    // The catch handler resets fontInitPromise on failure, allowing retry on next request.
    // Concurrent requests waiting on the same failing promise will all get the error.
    if (!fontInitPromise) {
      fontInitPromise = initBundledFonts().catch((error: unknown) => {
        fontInitPromise = null; // Reset on failure to allow retry
        throw error;
      });
    }
    await fontInitPromise;

    // 9. Sanitize text inputs to prevent XSS in rendered output
    const sanitizedData = {
      athleteName: sanitizeText(input.athleteName),
      teamName: input.teamName ? sanitizeText(input.teamName) : '',
      achievement: input.achievement ? sanitizeText(input.achievement) : '',
      tournamentName: sanitizeText(input.tournamentName),
      date: sanitizeText(input.tournamentDate),
      location: input.tournamentLocation ? sanitizeText(input.tournamentLocation) : '',
    };

    // 10. Generate poster using composePoster
    const posterResult = await composePoster({
      templateId: input.templateId,
      athletePhoto: parsed.file.buffer,
      data: sanitizedData,
      output: {
        format: 'jpeg',
        quality: POSTER_QUALITY,
      },
    });

    // 11. Generate thumbnail
    const thumbnail = await sharp(posterResult.buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    // 12. Generate poster ID and S3 keys BEFORE any writes
    const posterId = `pstr_${nanoid(12)}`;
    const uploadFormat = imageValidation.format as 'jpeg' | 'png' | 'heif';
    const keys = generatePosterKeys(userId, posterId, uploadFormat);
    s3Keys = keys; // Track for cleanup on failure

    // 13. Upload to S3 first (if this fails, we haven't touched the DB yet)
    const [posterUpload, thumbnailUpload] = await uploadMultipleToS3(
      [
        { key: keys.imageKey, buffer: posterResult.buffer, contentType: 'image/jpeg' },
        { key: keys.thumbnailKey, buffer: thumbnail, contentType: 'image/jpeg' },
        { key: keys.uploadKey, buffer: parsed.file.buffer, contentType: `image/${imageValidation.format}` },
      ],
      { requestId }
    );

    // 14. Save to DynamoDB with correct S3 keys
    const poster = await db.posters.create({
      posterId,
      userId,
      templateId: input.templateId,
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank,
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

    // 15. Return success response
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
        resetsAt: usageResult.resetsAt,
      },
    };

    console.log('Poster generated successfully', { requestId, posterId: poster.posterId });
    return createResponse(201, response, corsOrigin);
  } catch (error) {
    console.error('Poster generation failed', { requestId, error });

    // Rollback quota if we consumed it but failed
    if (quotaConsumed) {
      try {
        await db.users.decrementUsage(userId);
      } catch (rollbackError) {
        console.error('Failed to rollback quota', { requestId, userId, error: rollbackError });
      }
    }

    // Cleanup orphaned S3 objects if DB write failed after S3 upload
    if (s3Keys) {
      console.warn('Cleaning up orphaned S3 objects after DB failure', { requestId, keys: s3Keys });
      try {
        await Promise.all([
          deleteFromS3(s3Keys.imageKey, { requestId }),
          deleteFromS3(s3Keys.thumbnailKey, { requestId }),
          deleteFromS3(s3Keys.uploadKey, { requestId }),
        ]);
      } catch (cleanupError) {
        // Log but continue - S3 lifecycle rules can handle orphaned objects
        console.error('Failed to cleanup S3 objects', { requestId, error: cleanupError });
      }
    }

    // Return appropriate error based on failure type using typed errors
    if (error instanceof TemplateNotFoundError) {
      return createErrorResponse(404, 'Template not found', 'TEMPLATE_NOT_FOUND', corsOrigin);
    }
    if (error instanceof FontLoadError) {
      return createErrorResponse(500, 'Failed to initialize fonts', 'FONT_INIT_FAILED', corsOrigin);
    }
    if (error instanceof ExternalServiceError) {
      return createErrorResponse(500, 'Failed to upload poster', 'STORAGE_ERROR', corsOrigin);
    }

    // Fallback for untyped errors (legacy compatibility)
    if (error instanceof Error) {
      if (error.message.includes('S3') || error.message.includes('upload')) {
        return createErrorResponse(500, 'Failed to upload poster', 'STORAGE_ERROR', corsOrigin);
      }
      if (error.message.includes('DynamoDB') || error.message.includes('database')) {
        return createErrorResponse(500, 'Failed to save poster', 'DATABASE_ERROR', corsOrigin);
      }
    }

    return createErrorResponse(500, 'Failed to generate poster', 'GENERATION_FAILED', corsOrigin);
  }
};
