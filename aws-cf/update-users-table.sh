#!/usr/bin/env bash
set -euo pipefail

# Script to update the existing Users table with GSIs and PITR
# For Animal Genetics Research Platform

REGION="us-east-2"
TABLE_NAME="Users"

echo "Updating existing $TABLE_NAME table in $REGION..."

# Function to check if GSI is active
wait_for_gsi() {
  local index_name=$1
  local status="CREATING"
  
  while [ "$status" != "ACTIVE" ]; do
    echo "Waiting for $index_name to become active..."
    status=$(aws dynamodb describe-table \
      --region "$REGION" \
      --table-name "$TABLE_NAME" \
      --query "Table.GlobalSecondaryIndexes[?IndexName=='$index_name'].IndexStatus" \
      --output text)
    
    if [ -z "$status" ]; then
      echo "$index_name does not exist yet"
      return 1
    elif [ "$status" != "ACTIVE" ]; then
      echo "Current status: $status. Waiting 30 seconds..."
      sleep 30
    fi
  done
  
  echo "$index_name is now ACTIVE"
  return 0
}

# Function to check if GSI exists
gsi_exists() {
  local index_name=$1
  local result=$(aws dynamodb describe-table \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --query "Table.GlobalSecondaryIndexes[?IndexName=='$index_name']" \
    --output text)
  
  if [ -z "$result" ]; then
    return 1  # GSI does not exist
  else
    return 0  # GSI exists
  fi
}

# Process GSI1_UserByEmail
if gsi_exists "GSI1_UserByEmail"; then
  echo "GSI1_UserByEmail already exists"
  wait_for_gsi "GSI1_UserByEmail" || true
else
  echo "Adding GSI1_UserByEmail index..."
  aws dynamodb update-table \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
        AttributeName=UserId,AttributeType=S \
        AttributeName=Email,AttributeType=S \
    --global-secondary-index-updates '[
      {
        "Create":{
          "IndexName":"GSI1_UserByEmail",
          "KeySchema":[ {"AttributeName":"Email","KeyType":"HASH"} ],
          "Projection":{"ProjectionType":"ALL"}
        }
      }
    ]'
  
  wait_for_gsi "GSI1_UserByEmail"
fi

# Process GSI2_ByRole
if gsi_exists "GSI2_ByRole"; then
  echo "GSI2_ByRole already exists"
  wait_for_gsi "GSI2_ByRole" || true
else
  echo "Adding GSI2_ByRole index..."
  aws dynamodb update-table \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
        AttributeName=UserId,AttributeType=S \
        AttributeName=Role,AttributeType=S \
    --global-secondary-index-updates '[
      {
        "Create":{
          "IndexName":"GSI2_ByRole",
          "KeySchema":[
            {"AttributeName":"Role","KeyType":"HASH"},
            {"AttributeName":"UserId","KeyType":"RANGE"}
          ],
          "Projection":{"ProjectionType":"KEYS_ONLY"}
        }
      }
    ]'
  
  wait_for_gsi "GSI2_ByRole"
fi

# Enable Point-in-Time Recovery on Users
aws dynamodb update-continuous-backups \
  --region "$REGION" \
  --table-name "$TABLE_NAME" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Add tags
aws dynamodb tag-resource \
  --region "$REGION" \
  --resource-arn "arn:aws:dynamodb:$REGION:$(aws sts get-caller-identity --query 'Account' --output text):table/$TABLE_NAME" \
  --tags Key=Project,Value=GeneticsPlatform

echo "✅ $TABLE_NAME table updated successfully"
