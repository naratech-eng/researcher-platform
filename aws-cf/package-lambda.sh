#!/bin/bash

# package-lambda.sh - Package and deploy EIP DDNS Lambda function

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Packaging Lambda Function ==="
STACK_NAME="ec2-airflow-from-scratch"
LAMBDA_FUNCTION_FILE="eip_ddns_lambda.py"
ZIP_FILE="function.zip"
PACKAGE_DIR="lambda_package"

echo "Packaging Lambda function: $LAMBDA_FUNCTION_FILE with dependencies"

# Create a temporary directory for packaging
rm -rf "$PACKAGE_DIR" "$ZIP_FILE"
mkdir "$PACKAGE_DIR"

# Install dependencies into the package directory
echo "Installing dependencies..."
pip3 install requests -t "$PACKAGE_DIR"

# Copy the Lambda function code into the package directory
cp "$LAMBDA_FUNCTION_FILE" "$PACKAGE_DIR/"

# Create a zip file with the Lambda function code and dependencies
echo "Creating zip file: $ZIP_FILE"
(cd "$PACKAGE_DIR" && zip -r ../"$ZIP_FILE" .)

# Get Lambda function name from CloudFormation output
LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='LambdaFunctionName'].OutputValue" \
    --output text)

if [ -z "$LAMBDA_FUNCTION_NAME" ]; then
    echo "ERROR: Could not get Lambda function name from CloudFormation stack"
    exit 1
fi

echo "Updating Lambda function code for: $LAMBDA_FUNCTION_NAME"

# Update the Lambda function code and wait for it to complete
echo "Waiting for Lambda function update to complete..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" > /dev/null

echo "=== Lambda Function Updated Successfully ==="

# Clean up the temporary directory and zip file
rm -rf "$PACKAGE_DIR" "$ZIP_FILE"

echo "Package deployment complete!"
