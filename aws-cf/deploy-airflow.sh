#!/bin/bash

# This script deploys the generic EC2 host stack and manages EFS persistence.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
STACK_NAME="ec2-airflow-from-scratch"
TEMPLATE_FILE="ec2-airflow-stack.yml"
REGION="us-east-2"
EFS_TAG_KEY="AirflowCluster"
EFS_TAG_VALUE=$STACK_NAME

# --- EFS Discovery Logic ---
echo "Searching for existing EFS filesystem with tag ${EFS_TAG_KEY}=${EFS_TAG_VALUE}..."

FILESYSTEM_ID=$(aws efs describe-file-systems --region $REGION --query "FileSystems[?Tags[?Key=='$EFS_TAG_KEY' && Value=='$EFS_TAG_VALUE']].FileSystemId" --output text)

# --- Deployment Logic ---

# Construct the base command
CMD="aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --region $REGION \
    --no-fail-on-empty-changeset \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM"

# If an EFS filesystem was found, pass it as a parameter
if [ -n "$FILESYSTEM_ID" ]; then
    echo "Found existing EFS filesystem: $FILESYSTEM_ID. Reusing it."
    CMD="$CMD --parameter-overrides ExistingEFSFileSystemId=$FILESYSTEM_ID"
else
    echo "No existing EFS filesystem found. A new one will be created by CloudFormation."
fi

echo "\nExecuting deployment command..."

# Execute the command and check for failure
if ! eval $CMD; then
    echo "--------------------------------------------------"
    echo "CloudFormation deployment failed. Fetching events..."
    echo "--------------------------------------------------"
    # Fetch and display the most recent stack events to find the error
    aws cloudformation describe-stack-events --stack-name "$STACK_NAME" --region "$REGION" --max-items 20
    exit 1
fi

echo "\nCloudFormation stack deployment successful!"

# Deploy Lambda function code
echo "\n=== Deploying Lambda Function Code ==="
if [ -f "package-lambda.sh" ]; then
    ./package-lambda.sh
else
    echo "Warning: package-lambda.sh not found. Lambda function will use placeholder code."
fi

# --- Post-Deployment Instructions ---
echo "\n=== Deployment Complete ==="
echo "If you updated the Launch Template, remember to start an instance refresh in the Auto Scaling Group console to apply the changes."
echo "You can monitor the progress in the AWS CloudFormation console."
