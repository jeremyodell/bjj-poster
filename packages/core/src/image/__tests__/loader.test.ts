import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadImage, getImageMetadata } from '../loader.js';
import { ImageProcessingError, InvalidInputError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE_PATH = join(__dirname, '__fixtures__', 'test-image.png');

describe('loadImage', () => {
  it('loads image from file path', async () => {
    const image = await loadImage(TEST_IMAGE_PATH);
    expect(image).toBeDefined();
    expect(typeof image.resize).toBe('function');
  });

  it('loads image from Buffer', async () => {
    const buffer = readFileSync(TEST_IMAGE_PATH);
    const image = await loadImage(buffer);
    expect(image).toBeDefined();
    expect(typeof image.resize).toBe('function');
  });

  it('throws for non-existent file', async () => {
    await expect(loadImage('/does/not/exist.png')).rejects.toThrow(InvalidInputError);
  });

  it('throws for invalid buffer', async () => {
    await expect(loadImage(Buffer.from('not an image'))).rejects.toThrow(InvalidInputError);
  });
});

describe('loadImage from URL', () => {
  beforeAll(() => {
    global.fetch = vi.fn();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('loads image from URL', async () => {
    const imageBuffer = readFileSync(TEST_IMAGE_PATH);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      )),
    } as Response);

    const image = await loadImage('https://example.com/image.png');
    expect(image).toBeDefined();
  });

  it('throws for HTTP errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    } as Response);

    await expect(loadImage('https://example.com/missing.png')).rejects.toThrow(ImageProcessingError);
  });

  it('throws for non-image content type', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response);

    await expect(loadImage('https://example.com/page.html')).rejects.toThrow(InvalidInputError);
  });

  it('throws ImageProcessingError when fetch times out', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        reject(abortError);
      });
    });

    await expect(loadImage('https://example.com/slow.png')).rejects.toThrow(/timed out/);
  });

  it('throws InvalidInputError when Content-Length exceeds size limit', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '15000000', // 15MB, exceeds 10MB limit
      }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response);

    await expect(loadImage('https://example.com/huge.png')).rejects.toThrow(
      /Image too large.*exceeds.*byte limit/
    );
  });

  it('throws InvalidInputError when actual body size exceeds limit', async () => {
    // Create a mock response where Content-Length is not set but body is too large
    const largeBuffer = new ArrayBuffer(11 * 1024 * 1024); // 11MB

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: () => Promise.resolve(largeBuffer),
    } as Response);

    await expect(loadImage('https://example.com/large.png')).rejects.toThrow(
      /Image too large.*exceeds.*byte limit/
    );
  });
});

describe('loadImage URL security', () => {
  it('blocks localhost URLs', async () => {
    await expect(loadImage('http://localhost/image.png')).rejects.toThrow(InvalidInputError);
    await expect(loadImage('http://127.0.0.1/image.png')).rejects.toThrow(InvalidInputError);
  });

  it('blocks non-HTTP protocols', async () => {
    await expect(loadImage('file:///etc/passwd')).rejects.toThrow(InvalidInputError);
    await expect(loadImage('ftp://example.com/image.png')).rejects.toThrow(InvalidInputError);
  });
});

describe('getImageMetadata', () => {
  it('returns width, height, and format', async () => {
    const metadata = await getImageMetadata(TEST_IMAGE_PATH);
    expect(metadata).toEqual({
      width: 100,
      height: 100,
      format: 'png',
    });
  });

  it('works with Buffer input', async () => {
    const buffer = readFileSync(TEST_IMAGE_PATH);
    const metadata = await getImageMetadata(buffer);
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);
    expect(metadata.format).toBe('png');
  });

  it('throws for invalid image', async () => {
    await expect(getImageMetadata(Buffer.from('not an image'))).rejects.toThrow(InvalidInputError);
  });
});
