#!/bin/bash

# Script to fix the DDNS_PASSWORD environment variable in the Lambda function

# Get the password from .env file
source .env

# Get the Lambda function name
LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "ec2-airflow-from-scratch" \
    --region us-east-2 \
    --query "Stacks[0].Outputs[?OutputKey=='LambdaFunctionName'].OutputValue" \
    --output text)

echo "Updating Lambda function: $LAMBDA_FUNCTION_NAME"

# Directly set all environment variables
aws lambda update-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region us-east-2 \
    --environment "Variables={
        DOMAIN=naratech.xyz,
        HOST=etl,
        ALLOCATION_ID=eipalloc-02c30f687a2568c79,
        ASG_NAME=ec2-airflow-from-scratch-AutoScalingGroup-bfMwaNahnIB1,
        STACK_NAME=ec2-airflow-from-scratch,
        DDNS_PASSWORD=$DDNS_PASSWORD
    }"

echo "Lambda environment variables updated successfully."
echo "Triggering Lambda function..."

# Trigger the Lambda function with the correct instance ID
aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region us-east-2 \
    --payload '{"source": "aws.ec2", "detail-type": "EC2 Instance State-change Notification", "detail": {"state": "running", "instance-id": "i-08cb4210bc1e197c5"}}' \
    --cli-binary-format raw-in-base64-out \
    /dev/null

echo "Done! Check the Lambda logs to verify DDNS update."
