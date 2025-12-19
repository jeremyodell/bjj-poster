import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'hello/index': 'src/handlers/hello/index.ts',
    'templates/list-templates': 'src/handlers/templates/list-templates.ts',
  },
  format: ['cjs'],
  clean: true,
  outDir: 'dist',
  // Bundle everything except AWS SDK (provided by Lambda runtime)
  noExternal: [/.*/],
  external: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/s3-request-presigner',
  ],
});
