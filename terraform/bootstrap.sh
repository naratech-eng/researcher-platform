#!/usr/bin/env bash
set -euo pipefail

# Bootstrap Terraform backend infrastructure (S3 + DynamoDB)
# Run this once before first terraform init

REGION="us-east-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="naratech-terraform-state-${ACCOUNT_ID}-${REGION}"
DYNAMO_TABLE="naratech-terraform-locks"

echo "Creating S3 bucket: $BUCKET_NAME"
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
  echo "Bucket already exists."
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --versioning-configuration Status=Enabled
  aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --server-side-encryption-configuration '{
      "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
    }'
  echo "Bucket created and configured."
fi

echo "Creating DynamoDB table: $DYNAMO_TABLE"
if aws dynamodb describe-table --table-name "$DYNAMO_TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "Table already exists."
else
  aws dynamodb create-table \
    --table-name "$DYNAMO_TABLE" \
    --region "$REGION" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
  echo "Table created."
fi

echo ""
echo "Backend configuration for backend.tf:"
echo "  bucket         = \"$BUCKET_NAME\""
echo "  key            = \"shared-services/terraform.tfstate\""
echo "  region         = \"$REGION\""
echo "  encrypt        = true"
echo "  dynamodb_table = \"$DYNAMO_TABLE\""
