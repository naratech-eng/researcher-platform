#!/bin/bash

# update-lambda-env.sh - Update Lambda environment variables from .env file
#
# USAGE: ./update-lambda-env.sh [stack-name]
# 
# EXECUTION ORDER:
# 1. First run: ./deploy-airflow.sh (to create the CloudFormation stack and Lambda)
# 2. Then run: ./update-lambda-env.sh (to set DDNS environment variables)
#
# This script reads DDNS_PASSWORD, DOMAIN, and HOST from a .env file
# and updates the Lambda function's environment variables.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file based on env-example.txt"
    echo "Example:"
    echo "  cp env-example.txt .env"
    echo "  # Edit .env with your Namecheap DDNS details"
    exit 1
fi

# Source the .env file
echo "Loading environment variables from .env file..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

# Validate required variables
if [ -z "$DDNS_PASSWORD" ]; then
    echo "ERROR: DDNS_PASSWORD not set in .env file"
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    echo "ERROR: DOMAIN not set in .env file"
    exit 1
fi

# Set default host if not provided
if [ -z "$HOST" ]; then
    HOST="@"
fi

# Get the Lambda function name from CloudFormation stack
# Use provided stack name or default to match deploy script
STACK_NAME=${1:-"ec2-airflow-from-scratch"}
echo "Getting Lambda function name from stack: $STACK_NAME"

LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='LambdaFunctionName'].OutputValue" \
    --output text)

if [ -z "$LAMBDA_FUNCTION_NAME" ]; then
    echo "ERROR: Could not get Lambda function name from CloudFormation stack"
    exit 1
fi

echo "Lambda function name: $LAMBDA_FUNCTION_NAME"

# Get current environment variables (CloudFormation managed ones)
echo "Getting current Lambda environment variables..."
CURRENT_ENV=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --query "Environment.Variables" \
    --output json)

# Add DDNS components to the environment variables
echo "Updating Lambda environment variables with DDNS components..."
UPDATED_ENV=$(echo "$CURRENT_ENV" | jq \
    --arg ddns_password "$DDNS_PASSWORD" \
    --arg domain "$DOMAIN" \
    --arg host "$HOST" \
    '. + {DDNS_PASSWORD: $ddns_password, DOMAIN: $domain, HOST: $host}')

# Construct the final JSON payload for --cli-input-json
FINAL_PAYLOAD=$(cat <<EOF
{
    "FunctionName": "$LAMBDA_FUNCTION_NAME",
    "Environment": {
        "Variables": $UPDATED_ENV
    }
}
EOF
)

# Update the Lambda function environment using the full JSON payload
aws lambda update-function-configuration \
    --cli-input-json "$FINAL_PAYLOAD" > /dev/null

echo "=== Lambda Environment Updated Successfully ==="
echo "DDNS components have been set for the Lambda function:"
echo "  Domain: $DOMAIN"
echo "  Host: $HOST"
echo "  Password: [HIDDEN]"
echo "The Lambda function will now update $HOST.$DOMAIN DNS when the EIP changes."
