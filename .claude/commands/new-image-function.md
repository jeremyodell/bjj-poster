# New Image Function Scaffold

Create a new image processing function for the poster composition engine.

## Instructions

You are creating a new image processing function in `packages/core/src/image/`.

**Function name provided:** $ARGUMENTS

If no function name was provided, ask the user what function they want to create.

## Steps to Execute

### 1. Gather Requirements

Ask the user these questions if not already clear:

1. What does this function do? (Brief description)
2. What are the inputs? (image buffer, options, etc.)
3. What is the output? (buffer, metadata, Sharp instance?)
4. Does it need to integrate with existing functions?

### 2. Create the Function File

Create the file at: `packages/core/src/image/{function-name}.ts`

Use this template:

```typescript
import sharp, { Sharp } from 'sharp';
import { logger } from '@bjj-poster/core';
import { ImageProcessingError, InvalidInputError } from './errors';
import type { ImageMetadata } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for {functionName}
 */
export interface {FunctionName}Options {
  /** Description of this option */
  option1: Type;
}

/**
 * Result from {functionName}
 */
export interface {FunctionName}Result {
  /** The processed image buffer */
  buffer: Buffer;
  /** Metadata about the output image */
  metadata: ImageMetadata;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * {Brief description of what this function does}
 *
 * @param options - Configuration options
 * @returns Processed image buffer and metadata
 * @throws {InvalidInputError} When input validation fails
 * @throws {ImageProcessingError} When Sharp operation fails
 *
 * @example
 * ```typescript
 * const result = await {functionName}({
 *   // example options
 * });
 * console.log(result.metadata.width, result.metadata.height);
 * ```
 */
export async function {functionName}(
  options: {FunctionName}Options
): Promise<{FunctionName}Result> {
  logger.debug('{functionName} started', { /* log relevant options */ });

  try {
    // 1. Validate inputs
    // TODO: Add validation

    // 2. Perform Sharp operations
    // TODO: Implement

    // 3. Generate output
    const buffer = await sharp(/* ... */).toBuffer();
    const meta = await sharp(buffer).metadata();

    logger.debug('{functionName} completed', {
      width: meta.width,
      height: meta.height,
    });

    return {
      buffer,
      metadata: {
        width: meta.width!,
        height: meta.height!,
        format: meta.format!,
        channels: meta.channels!,
        hasAlpha: meta.hasAlpha ?? false,
      },
    };
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }

    logger.error('{functionName} failed', { error });
    throw new ImageProcessingError(
      `Failed in {functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### 3. Create the Test File

Create the test at: `packages/core/src/image/__tests__/{function-name}.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { {functionName} } from '../{function-name}';

const SNAPSHOTS_DIR = path.join(__dirname, '__snapshots__');
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');
const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';

beforeAll(async () => {
  if (!existsSync(SNAPSHOTS_DIR)) {
    await mkdir(SNAPSHOTS_DIR, { recursive: true });
  }
});

describe('{functionName}', () => {
  it('should process image correctly', async () => {
    // Arrange
    const input = await readFile(path.join(FIXTURES_DIR, 'test-input.png'));

    // Act
    const result = await {functionName}({
      // options
    });

    // Assert
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.metadata.width).toBeGreaterThan(0);
    expect(result.metadata.height).toBeGreaterThan(0);
  });

  it('should throw InvalidInputError for invalid input', async () => {
    await expect(
      {functionName}({
        // invalid options
      })
    ).rejects.toThrow(InvalidInputError);
  });

  // Add visual snapshot test if applicable
  it('should match visual snapshot', async () => {
    const input = await readFile(path.join(FIXTURES_DIR, 'test-input.png'));

    const result = await {functionName}({
      // options
    });

    const snapshotPath = path.join(SNAPSHOTS_DIR, '{function-name}-output.png');

    if (UPDATE_SNAPSHOTS || !existsSync(snapshotPath)) {
      await writeFile(snapshotPath, result.buffer);
    } else {
      const snapshot = await readFile(snapshotPath);
      // Compare buffers (simplified - use proper image comparison in real tests)
      expect(result.buffer.length).toBeCloseTo(snapshot.length, -2);
    }
  });
});
```

### 4. Export from Barrel

Add export to `packages/core/src/image/index.ts`:

```typescript
export * from './{function-name}';
```

### 5. Verify Setup

Run these commands to verify:

```bash
# Type check
pnpm type-check

# Run tests for this file
pnpm test packages/core/src/image/__tests__/{function-name}.test.ts
```

## After Scaffolding

Remind the user:

1. Fill in the `TODO` comments in the function
2. Add proper input validation
3. Update the test with real assertions
4. Add visual snapshots if the function produces visual output
5. Run `pnpm test` to ensure everything passes

## Example Usage

```
/new-image-function createGradientBackground
/new-image-function applyCircleMask
/new-image-function addTextOverlay
```
