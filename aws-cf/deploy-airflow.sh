#!/bin/bash

# This script deploys the generic EC2 host stack and manages EFS persistence.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
STACK_NAME="ec2-airflow-from-scratch"
TEMPLATE_FILE="ec2-airflow-stack.yml"
REGION="us-east-2"
EFS_TAG_KEY="AirflowCluster"
EFS_TAG_VALUE=$STACK_NAME
DOMAIN_NAME="etl.naratech.xyz"

# --- Parse Arguments ---
ENABLE_CLOUDFRONT="false"

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --enable-cloudfront)
      ENABLE_CLOUDFRONT="true"
      shift
      ;;
    *)
      # Unknown option
      shift
      ;;
  esac
done

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

# Build parameter overrides
PARAMS=""

# If an EFS filesystem was found, add it to parameters
if [ -n "$FILESYSTEM_ID" ]; then
    echo "Found existing EFS filesystem: $FILESYSTEM_ID. Reusing it."
    PARAMS="ExistingEFSFileSystemId=$FILESYSTEM_ID"
fi

# Handle CloudFront setup if requested
if [ "$ENABLE_CLOUDFRONT" == "true" ]; then
    echo "CloudFront distribution will be enabled."
    
    # Check if certificate ARN file exists
    if [ -f ".certificate-arn" ]; then
        CERTIFICATE_ARN=$(cat .certificate-arn)
        echo "Using Certificate ARN: $CERTIFICATE_ARN"
        
        # Check certificate status
        CERT_STATUS=$(aws acm describe-certificate \
            --region us-east-1 \
            --certificate-arn "$CERTIFICATE_ARN" \
            --query "Certificate.Status" \
            --output text)
            
        if [ "$CERT_STATUS" != "ISSUED" ]; then
            echo "⚠️  Warning: Certificate is not validated yet (Status: $CERT_STATUS)"
            echo "CloudFront will be configured but may not work until certificate validation is complete."
            echo "Add the DNS validation record to your Namecheap DNS settings if you haven't already."
            read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
        else
            echo "✓ Certificate is validated and ready to use."
        fi
        
        # Add CloudFront parameters
        if [ -n "$PARAMS" ]; then
            PARAMS="$PARAMS EnableCloudFront=true SSLCertificateArn=$CERTIFICATE_ARN DomainName=$DOMAIN_NAME"
        else
            PARAMS="EnableCloudFront=true SSLCertificateArn=$CERTIFICATE_ARN DomainName=$DOMAIN_NAME"
        fi
    else
        echo "⚠️  Error: Certificate ARN file not found. Run ./request-certificate.sh first."
        exit 1
    fi
fi

# Add parameters to command if any were specified
if [ -n "$PARAMS" ]; then
    CMD="$CMD --parameter-overrides $PARAMS"
fi

echo "\nExecuting deployment command..."
echo "$CMD"
echo ""

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

# If CloudFront was enabled, provide instructions for DNS update
if [ "$ENABLE_CLOUDFRONT" == "true" ]; then
    # Get the CloudFront domain name from the stack outputs
    echo "\n=== CloudFront Configuration ==="
    echo "Retrieving CloudFront domain name..."
    sleep 5  # Small delay to ensure output is available
    
    CF_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
        --output text)
    
    if [ -n "$CF_DOMAIN" ]; then
        echo "\n🔒 HTTPS Configuration Steps:\n"
        echo "1. Go to Namecheap DNS settings for $DOMAIN_NAME"
        echo "2. Update the A record to a CNAME record pointing to: $CF_DOMAIN"
        echo "3. Once DNS propagates, you can access:"
        echo "   - Airflow: https://$DOMAIN_NAME/airflow/"
        echo "   - Keycloak: https://$DOMAIN_NAME/keycloak/"
    else
        echo "\n⚠️  CloudFront domain information not yet available. Wait a few minutes and run:"
        echo "aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query \"Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue\" --output text"
    fi
fi
