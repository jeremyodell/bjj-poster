#!/bin/bash
set -e

echo "========================================="
echo "Initializing LocalStack for BJJ Poster App"
echo "========================================="

# Wait for LocalStack to be ready
echo "Waiting for LocalStack..."
sleep 5

# Create DynamoDB table with single-table design
echo "Creating DynamoDB table..."
awslocal dynamodb create-table \
  --table-name bjj-poster-app \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "GSI1",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null || echo "Table already exists"

# Create S3 buckets
echo "Creating S3 buckets..."
awslocal s3 mb s3://bjj-poster-uploads 2>/dev/null || echo "Uploads bucket already exists"
awslocal s3 mb s3://bjj-poster-generated 2>/dev/null || echo "Generated bucket already exists"
awslocal s3 mb s3://bjj-poster-templates 2>/dev/null || echo "Templates bucket already exists"

# Configure CORS for uploads bucket
echo "Configuring S3 CORS..."
awslocal s3api put-bucket-cors --bucket bjj-poster-uploads --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Create SQS queues
echo "Creating SQS queues..."
awslocal sqs create-queue --queue-name poster-generation-queue 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name poster-generation-dlq 2>/dev/null || echo "DLQ already exists"

# Create Secrets
echo "Creating secrets..."
awslocal secretsmanager create-secret \
  --name bjj-poster/stripe-secret-key \
  --secret-string "sk_test_placeholder" \
  2>/dev/null || echo "Stripe secret already exists"

awslocal secretsmanager create-secret \
  --name bjj-poster/stripe-webhook-secret \
  --secret-string "whsec_placeholder" \
  2>/dev/null || echo "Webhook secret already exists"

# Seed some template data
echo "Seeding template data..."
awslocal dynamodb put-item \
  --table-name bjj-poster-app \
  --item '{
    "PK": {"S": "TEMPLATE"},
    "SK": {"S": "tournament#tmpl_001"},
    "entityType": {"S": "TEMPLATE"},
    "templateId": {"S": "tmpl_001"},
    "name": {"S": "Classic Tournament"},
    "description": {"S": "Bold text with action photo background"},
    "category": {"S": "tournament"},
    "thumbnailUrl": {"S": "https://bjj-poster-templates.s3.localhost.localstack.cloud:4566/thumbnails/classic.png"},
    "isPremium": {"BOOL": false},
    "createdAt": {"S": "2024-01-01T00:00:00Z"}
  }'

awslocal dynamodb put-item \
  --table-name bjj-poster-app \
  --item '{
    "PK": {"S": "TEMPLATE"},
    "SK": {"S": "tournament#tmpl_002"},
    "entityType": {"S": "TEMPLATE"},
    "templateId": {"S": "tmpl_002"},
    "name": {"S": "Modern Gradient"},
    "description": {"S": "Clean gradient background with centered athlete"},
    "category": {"S": "tournament"},
    "thumbnailUrl": {"S": "https://bjj-poster-templates.s3.localhost.localstack.cloud:4566/thumbnails/gradient.png"},
    "isPremium": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00Z"}
  }'

awslocal dynamodb put-item \
  --table-name bjj-poster-app \
  --item '{
    "PK": {"S": "TEMPLATE"},
    "SK": {"S": "promotion#tmpl_003"},
    "entityType": {"S": "TEMPLATE"},
    "templateId": {"S": "tmpl_003"},
    "name": {"S": "Belt Promotion"},
    "description": {"S": "Celebrate your belt promotion with this elegant design"},
    "category": {"S": "promotion"},
    "thumbnailUrl": {"S": "https://bjj-poster-templates.s3.localhost.localstack.cloud:4566/thumbnails/promotion.png"},
    "isPremium": {"BOOL": false},
    "createdAt": {"S": "2024-01-01T00:00:00Z"}
  }'

echo "========================================="
echo "LocalStack initialization complete!"
echo ""
echo "Resources created:"
echo "  - DynamoDB table: bjj-poster-app"
echo "  - S3 buckets: bjj-poster-uploads, bjj-poster-generated, bjj-poster-templates"
echo "  - SQS queues: poster-generation-queue, poster-generation-dlq"
echo "  - Secrets: stripe-secret-key, stripe-webhook-secret"
echo ""
echo "Access points:"
echo "  - LocalStack: http://localhost:4566"
echo "  - DynamoDB Admin: http://localhost:8001"
echo "========================================="
