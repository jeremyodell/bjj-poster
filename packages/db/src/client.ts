import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = 
  process.env.NODE_ENV === 'development' || 
  process.env.USE_LOCALSTACK === 'true';

const baseClient = new DynamoDBClient(
  isLocal
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      }
    : {
        region: process.env.AWS_REGION || 'us-east-1',
      }
);

export const dynamoClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});
