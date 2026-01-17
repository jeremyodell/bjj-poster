/**
 * S3 Upload Helpers
 *
 * Provides utilities for uploading and deleting files in S3.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const isLocal = process.env.USE_LOCALSTACK === 'true';

// Request timeout for S3 operations (30 seconds)
const S3_REQUEST_TIMEOUT_MS = 30_000;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

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

  throw new Error(`S3 upload failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
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
 */
export function generatePosterKeys(
  userId: string,
  posterId: string
): { imageKey: string; thumbnailKey: string; uploadKey: string } {
  return {
    imageKey: `posters/${userId}/${posterId}/original.jpg`,
    thumbnailKey: `posters/${userId}/${posterId}/thumbnail.jpg`,
    uploadKey: `uploads/${userId}/${posterId}/photo.jpg`,
  };
}
