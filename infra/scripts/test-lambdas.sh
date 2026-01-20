#!/bin/bash
set -e

STAGE=${1:-dev}
API_URL=$(aws cloudformation describe-stacks --region us-east-1 --stack-name BjjPosterApi-$STAGE --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

echo "🧪 Testing Lambda Functions for $STAGE environment"
echo "API URL: $API_URL"
echo ""

# Test via API Gateway
echo "==================================="
echo "Method 1: API Gateway Endpoints"
echo "==================================="

echo ""
echo "📋 GET /templates"
curl -s -X GET "$API_URL/templates" | jq '.'

echo ""
echo "🖼️  GET /posters (Get User Posters)"
curl -s -X GET "$API_URL/posters" | jq '.'

echo ""
echo "👤 GET /user/profile"
curl -s -X GET "$API_URL/user/profile" | jq '.'

echo ""
echo "📝 POST /posters (Generate Poster)"
curl -s -X POST "$API_URL/posters" \
  -H "Content-Type: application/json" \
  -d '{"template":"test","data":{}}' | jq '.'

echo ""
echo "==================================="
echo "Method 2: Direct Lambda Invocation"
echo "==================================="

# Get function names
FUNCTIONS=$(aws lambda list-functions --region us-east-1 --query "Functions[?contains(FunctionName, 'BjjPosterApi-$STAGE')].FunctionName" --output text)

for FUNC in $FUNCTIONS; do
  echo ""
  echo "⚡ Testing: $FUNC"
  aws lambda invoke \
    --function-name $FUNC \
    --cli-binary-format raw-in-base64-out \
    --payload '{}' \
    /tmp/lambda-test-response.json \
    --region us-east-1 \
    --query 'StatusCode' \
    --output text > /dev/null
  
  cat /tmp/lambda-test-response.json | jq '.body | fromjson'
done

echo ""
echo "==================================="
echo "Method 3: CloudWatch Metrics"
echo "==================================="

for FUNC in $FUNCTIONS; do
  INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$FUNC \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Sum \
    --region us-east-1 \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")
  
  echo "📊 $(basename $FUNC): $INVOCATIONS invocations (last 5 min)"
done

echo ""
echo "✅ Testing complete!"
