#!/bin/bash

# This script deploys a self-contained, scalable EC2 environment using CloudFormation.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
STACK_NAME="general-purpose-ec2-stack"
TEMPLATE_FILE="ec2-airflow-stack.yml"
REGION="us-east-2"

# --- IMPORTANT ---
# After the first successful deployment, find your EFS File System ID
# in the CloudFormation stack's "Outputs" tab and paste it here.
# This ensures you reuse the same EFS and preserve your data on subsequent deployments.
# Example: EXISTING_EFS_ID="fs-0123456789abcdef0"
EXISTING_EFS_ID="fs-080bda99a6d6b7c6f"

PARAMS=()
if [ -n "$EXISTING_EFS_ID" ]; then
  PARAMS+=("ParameterKey=ExistingEFSFileSystemId,ParameterValue=$EXISTING_EFS_ID")
fi

# --- Deployment ---
echo "Deploying CloudFormation stack: $STACK_NAME..."

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  ${PARAMS:+--parameter-overrides ${PARAMS[@]}}

if [ $? -ne 0 ]; then
    echo "CloudFormation stack deployment failed."
    echo "To see the events, run: aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $REGION"
    exit 1
fi

echo "CloudFormation stack deployment initiated successfully."
echo "You can monitor the progress in the AWS CloudFormation console."
