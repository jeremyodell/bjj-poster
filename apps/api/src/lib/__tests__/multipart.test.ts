import { describe, it, expect } from 'vitest';
import { parseMultipart } from '../multipart.js';

describe('parseMultipart', () => {
  it('parses form fields and file', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
      `Content-Disposition: form-data; name="athleteName"`,
      ``,
      `João Silva`,
      `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
      `Content-Disposition: form-data; name="photo"; filename="test.jpg"`,
      `Content-Type: image/jpeg`,
      ``,
      `fake-image-data`,
      `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`
    );

    expect(result.fields.athleteName).toBe('João Silva');
    expect(result.file).toBeDefined();
    expect(result.file?.fieldname).toBe('photo');
    expect(result.file?.filename).toBe('test.jpg');
  });

  it('throws on missing content-type', async () => {
    await expect(parseMultipart('body', '')).rejects.toThrow();
  });
});
