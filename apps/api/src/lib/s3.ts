/**
 * S3 Upload Helpers
 *
 * Provides utilities for uploading and deleting files in S3.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ExternalServiceError } from '@bjj-poster/core';

const isLocal = process.env.USE_LOCALSTACK === 'true';

// Request timeout for S3 operations (30 seconds)
const S3_REQUEST_TIMEOUT_MS = 30_000;

// Retry configuration - configurable via environment for different stages
// Production may want more retries, dev/test may want fewer for faster feedback
const MAX_RETRIES = parseInt(process.env.S3_MAX_RETRIES || '3', 10);
const INITIAL_RETRY_DELAY_MS = parseInt(process.env.S3_INITIAL_RETRY_DELAY_MS || '1000', 10);

export const s3Client = new S3Client(
  isLocal
    ? {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1',
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        forcePathStyle: true,
        requestHandler: {
          requestTimeout: S3_REQUEST_TIMEOUT_MS,
        },
      }
    : {
        region: process.env.AWS_REGION || 'us-east-1',
        requestHandler: {
          requestTimeout: S3_REQUEST_TIMEOUT_MS,
        },
      }
);

// Bucket name is required in non-local environments
const BUCKET_NAME = process.env.POSTER_BUCKET_NAME || (isLocal ? 'bjj-poster-app-posters' : '');
if (!BUCKET_NAME) {
  throw new Error('POSTER_BUCKET_NAME environment variable is required');
}

const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

/**
 * Sleep for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload a buffer to S3 with retry logic
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      return {
        key,
        url: `${CDN_URL}/${key}`,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`S3 upload attempt ${attempt}/${MAX_RETRIES} failed`, {
        key,
        error: lastError.message,
      });

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        await sleep(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw new ExternalServiceError(`S3 upload failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Delete an object from S3 (for cleanup on failures)
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Upload multiple files to S3 in parallel
 */
export async function uploadMultipleToS3(
  uploads: Array<{ key: string; buffer: Buffer; contentType: string }>
): Promise<UploadResult[]> {
  return Promise.all(
    uploads.map(({ key, buffer, contentType }) =>
      uploadToS3(key, buffer, contentType)
    )
  );
}

/**
 * Generate S3 keys for a poster
 *
 * S3 Key Structure:
 * - posters/{userId}/{posterId}/original.jpg  - Final generated poster (always JPEG)
 * - posters/{userId}/{posterId}/thumbnail.jpg - Thumbnail preview (always JPEG)
 * - uploads/{userId}/{posterId}/photo.{ext}   - Original user photo (preserves format)
 *
 * Note on upload key naming:
 * - Uses generic "photo" name instead of original filename for privacy (filenames may contain PII)
 * - HEIC uploads are converted to JPEG by sharp during validation, so only jpg/png in uploads/
 * - uploads/ directory has S3 lifecycle rule to auto-delete after 7 days (see storage-stack.ts)
 *
 * @param userId - User ID
 * @param posterId - Poster ID
 * @param uploadFormat - Original photo format ('jpeg' or 'png') for the upload key
 */
export function generatePosterKeys(
  userId: string,
  posterId: string,
  uploadFormat: 'jpeg' | 'png' = 'jpeg'
): { imageKey: string; thumbnailKey: string; uploadKey: string } {
  const uploadExtension = uploadFormat === 'png' ? 'png' : 'jpg';
  return {
    imageKey: `posters/${userId}/${posterId}/original.jpg`,
    thumbnailKey: `posters/${userId}/${posterId}/thumbnail.jpg`,
    uploadKey: `uploads/${userId}/${posterId}/photo.${uploadExtension}`,
  };
}
