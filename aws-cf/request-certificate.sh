#!/bin/bash

# Script to request an ACM certificate in us-east-1 and configure CloudFront

set -e  # Exit on error

# Configuration
DOMAIN_NAME="etl.naratech.xyz"
REGION_ACM="us-east-1"        # ACM certificates for CloudFront must be in us-east-1
REGION_STACK="us-east-2"      # Your CloudFormation stack region
STACK_NAME="ec2-airflow-from-scratch"

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AWS Certificate Manager (ACM) Certificate Request ===${NC}"
echo -e "Requesting certificate for ${YELLOW}$DOMAIN_NAME${NC} in region ${YELLOW}$REGION_ACM${NC}..."

# Request the certificate
CERTIFICATE_ARN=$(aws acm request-certificate \
  --region $REGION_ACM \
  --domain-name $DOMAIN_NAME \
  --validation-method DNS \
  --query "CertificateArn" \
  --output text)

echo -e "${GREEN}Certificate requested successfully!${NC}"
echo -e "Certificate ARN: ${YELLOW}$CERTIFICATE_ARN${NC}"

# Wait for AWS to generate the validation records
echo -e "${BLUE}Waiting for DNS validation information to be ready...${NC}"
sleep 5

# Get the DNS validation CNAME record details
VALIDATION_INFO=$(aws acm describe-certificate \
  --region $REGION_ACM \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord")

# Check if validation info is available yet
while [[ "$VALIDATION_INFO" == "null" ]]; do
  echo "Waiting for validation records to be generated..."
  sleep 10
  VALIDATION_INFO=$(aws acm describe-certificate \
    --region $REGION_ACM \
    --certificate-arn $CERTIFICATE_ARN \
    --query "Certificate.DomainValidationOptions[0].ResourceRecord")
done

# Extract validation record details
VALIDATION_NAME=$(aws acm describe-certificate \
  --region $REGION_ACM \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord.Name" \
  --output text)

VALIDATION_VALUE=$(aws acm describe-certificate \
  --region $REGION_ACM \
  --certificate-arn $CERTIFICATE_ARN \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord.Value" \
  --output text)

echo -e "\n${BLUE}=== DNS Validation Required ===${NC}"
echo -e "To validate your certificate, add the following CNAME record to your Namecheap DNS settings:"
echo -e "${YELLOW}Important:${NC} For Namecheap DNS with subdomains like etl.naratech.xyz, you need to use this format"
echo -e "\n${GREEN}CNAME Record to Add:${NC}"
# For Namecheap DNS, we need a special format for subdomains
# Extract the validation part (like _8b20e560bb3990ec4d226872b21912ac)
VALIDATION_PREFIX=$(echo $VALIDATION_NAME | cut -d'.' -f1)
SUBDOMAIN=$(echo $DOMAIN_NAME | cut -d'.' -f1)

# For Namecheap, the Host field should be: validation_prefix.subdomain
NAMECHEAP_HOST="${VALIDATION_PREFIX}.${SUBDOMAIN}"

echo -e "Host: ${YELLOW}$NAMECHEAP_HOST${NC}"
echo -e "Value: ${YELLOW}$VALIDATION_VALUE${NC}"
echo -e "TTL: 5 min (or lowest available)"

# Save certificate ARN for later use
echo $CERTIFICATE_ARN > .certificate-arn

echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo -e "1. Add the CNAME record above to your Namecheap DNS settings"
echo -e "2. Wait for validation to complete (can take 5-30 minutes)"
echo -e "3. Run the following command to check validation status:"
echo -e "   ${YELLOW}aws acm describe-certificate --region $REGION_ACM --certificate-arn $CERTIFICATE_ARN --query \"Certificate.Status\" --output text${NC}"
echo -e "4. Once validated (shows 'ISSUED'), deploy the CloudFormation stack with CloudFront:"
echo -e "   ${YELLOW}./deploy-airflow.sh --enable-cloudfront${NC}"

echo -e "\nCertificate ARN saved to .certificate-arn"
