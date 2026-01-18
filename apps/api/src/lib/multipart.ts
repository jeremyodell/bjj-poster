/**
 * Multipart Form Data Parser
 *
 * Parses multipart/form-data requests for Lambda handlers.
 */

import Busboy from 'busboy';
import { Readable } from 'stream';

export interface ParsedFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  file: ParsedFile | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed MIME types for early rejection (actual format validated by sharp later)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

/**
 * Internal parser that handles the busboy stream processing
 */
function createBusboyParser(
  contentType: string,
  bodyBuffer: Buffer
): Promise<ParsedMultipart> {
  return new Promise((resolve, reject) => {
    if (!contentType || !contentType.includes('multipart/form-data')) {
      reject(new Error('Invalid content type: expected multipart/form-data'));
      return;
    }

    const fields: Record<string, string> = {};
    let file: ParsedFile | null = null;

    const busboy = Busboy({
      headers: { 'content-type': contentType },
      limits: { fileSize: MAX_FILE_SIZE },
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const { filename, encoding, mimeType } = info;

      // Early rejection of invalid MIME types to avoid buffering garbage
      // Note: Actual image format is validated with sharp after parsing
      if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        stream.resume(); // Drain the stream
        reject(new Error(`Invalid file type: ${mimeType}. Allowed types: JPEG, PNG, HEIC`));
        return;
      }

      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        file = {
          fieldname,
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks),
        };
      });

      stream.on('limit', () => {
        reject(new Error(`File exceeds maximum size of ${MAX_FILE_SIZE} bytes`));
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, file });
    });

    busboy.on('error', (error: Error) => {
      reject(error);
    });

    const bodyStream = Readable.from(bodyBuffer);
    bodyStream.pipe(busboy);
  });
}

/**
 * Parse multipart form data from UTF-8 encoded body
 */
export function parseMultipart(
  body: string,
  contentType: string
): Promise<ParsedMultipart> {
  return createBusboyParser(contentType, Buffer.from(body, 'utf8'));
}

/**
 * Parse multipart from base64-encoded body (API Gateway)
 */
export function parseMultipartBase64(
  body: string,
  contentType: string
): Promise<ParsedMultipart> {
  return createBusboyParser(contentType, Buffer.from(body, 'base64'));
}
