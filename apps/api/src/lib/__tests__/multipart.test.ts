import { describe, it, expect } from 'vitest';
import { parseMultipart, parseMultipartBase64 } from '../multipart.js';

describe('parseMultipart', () => {
  it('parses form fields and file', async () => {
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
    await expect(parseMultipart('body', '')).rejects.toThrow(
      'Invalid content type: expected multipart/form-data'
    );
  });

  it('throws on wrong content-type', async () => {
    await expect(parseMultipart('body', 'application/json')).rejects.toThrow(
      'Invalid content type: expected multipart/form-data'
    );
  });

  it('parses multiple form fields', async () => {
    const body = [
      `------boundary`,
      `Content-Disposition: form-data; name="field1"`,
      ``,
      `value1`,
      `------boundary`,
      `Content-Disposition: form-data; name="field2"`,
      ``,
      `value2`,
      `------boundary`,
      `Content-Disposition: form-data; name="field3"`,
      ``,
      `value3`,
      `------boundary--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.fields.field1).toBe('value1');
    expect(result.fields.field2).toBe('value2');
    expect(result.fields.field3).toBe('value3');
    expect(result.file).toBeNull();
  });

  it('returns null file when no file is uploaded', async () => {
    const body = [
      `------boundary`,
      `Content-Disposition: form-data; name="name"`,
      ``,
      `Test`,
      `------boundary--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.file).toBeNull();
    expect(result.fields.name).toBe('Test');
  });

  it('extracts file metadata correctly', async () => {
    const body = [
      `------boundary`,
      `Content-Disposition: form-data; name="image"; filename="photo.png"`,
      `Content-Type: image/png`,
      ``,
      `PNG binary data here`,
      `------boundary--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.file).toBeDefined();
    expect(result.file?.fieldname).toBe('image');
    expect(result.file?.filename).toBe('photo.png');
    expect(result.file?.mimeType).toBe('image/png');
    expect(result.file?.buffer).toBeInstanceOf(Buffer);
    expect(result.file?.buffer.toString()).toBe('PNG binary data here');
  });

  it('handles empty fields', async () => {
    const body = [
      `------boundary`,
      `Content-Disposition: form-data; name="emptyField"`,
      ``,
      ``,
      `------boundary--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.fields.emptyField).toBe('');
  });

  it('handles special characters in field values', async () => {
    const body = [
      `------boundary`,
      `Content-Disposition: form-data; name="specialChars"`,
      ``,
      `<script>alert("xss")</script> & "quotes" 日本語`,
      `------boundary--`,
    ].join('\r\n');

    const result = await parseMultipart(
      body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.fields.specialChars).toBe(
      `<script>alert("xss")</script> & "quotes" 日本語`
    );
  });
});

describe('parseMultipartBase64', () => {
  it('parses base64-encoded multipart body', async () => {
    const rawBody = [
      `------boundary`,
      `Content-Disposition: form-data; name="name"`,
      ``,
      `Test User`,
      `------boundary`,
      `Content-Disposition: form-data; name="file"; filename="test.jpg"`,
      `Content-Type: image/jpeg`,
      ``,
      `fake-image-data`,
      `------boundary--`,
    ].join('\r\n');

    const base64Body = Buffer.from(rawBody).toString('base64');

    const result = await parseMultipartBase64(
      base64Body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.fields.name).toBe('Test User');
    expect(result.file).toBeDefined();
    expect(result.file?.filename).toBe('test.jpg');
    expect(result.file?.buffer.toString()).toBe('fake-image-data');
  });

  it('throws on invalid content-type for base64 parser', async () => {
    const base64Body = Buffer.from('test').toString('base64');
    await expect(
      parseMultipartBase64(base64Body, 'application/json')
    ).rejects.toThrow('Invalid content type: expected multipart/form-data');
  });

  it('rejects files with invalid MIME types', async () => {
    const rawBody = [
      `------boundary`,
      `Content-Disposition: form-data; name="file"; filename="test.txt"`,
      `Content-Type: text/plain`,
      ``,
      `Hello World`,
      `------boundary--`,
    ].join('\r\n');

    const base64Body = Buffer.from(rawBody).toString('base64');

    await expect(
      parseMultipartBase64(base64Body, 'multipart/form-data; boundary=----boundary')
    ).rejects.toThrow('Invalid file type: text/plain');
  });

  it('handles binary data in base64 encoding', async () => {
    // Create a simple binary pattern
    const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const boundary = '----boundary';
    const parts = [
      `------boundary`,
      `Content-Disposition: form-data; name="binary"; filename="image.png"`,
      `Content-Type: image/png`,
      ``,
    ];

    // Construct the body with binary data
    const headerPart = parts.join('\r\n') + '\r\n';
    const footerPart = '\r\n------boundary--';

    const fullBody = Buffer.concat([
      Buffer.from(headerPart),
      binaryData,
      Buffer.from(footerPart),
    ]);

    const base64Body = fullBody.toString('base64');

    const result = await parseMultipartBase64(
      base64Body,
      'multipart/form-data; boundary=----boundary'
    );

    expect(result.file).toBeDefined();
    expect(result.file?.buffer).toEqual(binaryData);
  });
});
