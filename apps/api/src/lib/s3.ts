/**
 * S3 Upload Helpers
 *
 * Provides utilities for uploading files to S3.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const isLocal = process.env.USE_LOCALSTACK === 'true';

export const s3Client = new S3Client(
  isLocal
    ? {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1',
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        forcePathStyle: true,
      }
    : { region: process.env.AWS_REGION || 'us-east-1' }
);

const BUCKET_NAME = process.env.POSTER_BUCKET_NAME || 'bjj-poster-app-posters';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload a buffer to S3
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
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
