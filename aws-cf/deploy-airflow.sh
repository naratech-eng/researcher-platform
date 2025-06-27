#!/bin/bash

# This script deploys the Airflow EC2 instance using CloudFormation.
# It follows the pattern of the existing deploy.sh script.

# Get the directory of this script and change into it.
# This ensures that the template file is found correctly.
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR" || exit 1

STACK_NAME="general-purpose-ec2-stack"
TEMPLATE_FILE="ec2-airflow-stack.yml"
REGION="us-east-2" # Or your preferred region

# Validate the CloudFormation template
echo "Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://"$TEMPLATE_FILE" --region "$REGION"
if [ $? -ne 0 ]; then
  echo "CloudFormation template validation failed."
  exit 1
fi
echo "Template is valid."

# Deploy the CloudFormation stack
echo "Deploying CloudFormation stack..."
# IMPORTANT: Replace with your actual subnet ID from the us-east-2 region.
SUBNET_IDS="subnet-0a293dcfa6150060a"

aws cloudformation deploy \
  --parameter-overrides SubnetIds="$SUBNET_IDS" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --region "$REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Project=GeneticsPlatform

if [ $? -eq 0 ]; then
  echo "CloudFormation stack deployment initiated successfully."
  echo "You can monitor the progress in the AWS CloudFormation console."
else
  echo "CloudFormation stack deployment failed."
  exit 1
fi
