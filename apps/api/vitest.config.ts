import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/handlers/payments/__tests__/setup.ts'],
    globals: false,
    environment: 'node',
    exclude: ['**/*.integration.test.ts', '**/node_modules/**'],
  },
});
