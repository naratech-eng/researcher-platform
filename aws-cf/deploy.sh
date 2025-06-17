#!/usr/bin/env bash
set -euo pipefail

# DynamoDB CloudFormation deployment script
# For Animal Genetics Research Platform

REGION="us-east-2"
STACK_NAME="genetics-dynamodb"

echo "Deploying DynamoDB tables to $REGION..."

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file dynamodb-stack.yml \
  --capabilities CAPABILITY_IAM \
  --tags Project=GeneticsPlatform

echo "✅ Deployment complete"
echo "To verify tables:"
echo "aws dynamodb list-tables --region $REGION"
