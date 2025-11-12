#!/usr/bin/env bash
set -euo pipefail

# Defaults
REGION="${REGION:-us-east-2}"
STACK_NAME="${STACK_NAME:-genetics-docdb-elastic}"
# Resolve template path relative to this script's directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$SCRIPT_DIR/docdb-elastic-userdata-stack.yml"

# Optional inputs (auto-discovered if empty)
VPC_ID="${VPC_ID:-}"
SUBNET_IDS="${SUBNET_IDS:-}" # Comma-separated: subnet-aaa,subnet-bbb

# Optional ingress options (choose one)
APP_SG_ID="${APP_SG_ID:-}"   # Security Group ID of app needing access
INGRESS_CIDR="${INGRESS_CIDR:-}" # e.g., 10.0.0.0/16

# Optional overrides
CLUSTER_NAME="${CLUSTER_NAME:-user-data-docdb-elastic}"
ADMIN_USERNAME="${ADMIN_USERNAME:-docdbadmin}"
SHARD_CAPACITY="${SHARD_CAPACITY:-2}"       # Allowed: 2,4,8,16,32,64
SHARD_COUNT="${SHARD_COUNT:-1}"
SHARD_INSTANCE_COUNT="${SHARD_INSTANCE_COUNT:-1}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
KMS_KEY_ID="${KMS_KEY_ID:-}"                 # Optional KMS key ARN or alias

# --- Auto-discover VPC and Subnets if not provided ---
if [[ -z "$VPC_ID" ]]; then
  echo "Discovering default VPC in $REGION..."
  VPC_ID=$(aws ec2 describe-vpcs \
    --region "$REGION" \
    --filters "Name=isDefault,Values=true" \
    --query "Vpcs[0].VpcId" \
    --output text)
  if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
    echo "ERROR: No default VPC found in $REGION. Please export VPC_ID explicitly." >&2
    exit 1
  fi
  echo "Found default VPC: $VPC_ID"
fi

if [[ -z "$SUBNET_IDS" ]]; then
  echo "Discovering private subnets in $VPC_ID (preferring MapPublicIpOnLaunch=false)..."
  # Try private subnets first
  PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
    --region "$REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[?MapPublicIpOnLaunch==\`false\` && State=='available'].SubnetId" \
    --output text)
  if [[ -n "$PRIVATE_SUBNETS" ]]; then
    SUBNET_IDS_CSV=$(echo "$PRIVATE_SUBNETS" | tr '\t\n' ',' | sed 's/,$//')
    echo "Using private subnets: $SUBNET_IDS_CSV"
  else
    echo "No private subnets detected. Falling back to all available subnets in the VPC."
    ALL_SUBNETS=$(aws ec2 describe-subnets \
      --region "$REGION" \
      --filters "Name=vpc-id,Values=$VPC_ID" \
      --query "Subnets[?State=='available'].SubnetId" \
      --output text)
    if [[ -z "$ALL_SUBNETS" ]]; then
      echo "ERROR: No subnets found in VPC $VPC_ID. Please create subnets or export SUBNET_IDS." >&2
      exit 1
    fi
    SUBNET_IDS_CSV=$(echo "$ALL_SUBNETS" | tr '\t\n' ',' | sed 's/,$//')
    echo "Using subnets: $SUBNET_IDS_CSV"
  fi
else
  SUBNET_IDS_CSV="$SUBNET_IDS"
fi

PARAMS=(
  "VpcId=$VPC_ID"
  "SubnetIds=$SUBNET_IDS_CSV"
  "ClusterName=$CLUSTER_NAME"
  "AdminUserName=$ADMIN_USERNAME"
  "ShardCapacity=$SHARD_CAPACITY"
  "ShardCount=$SHARD_COUNT"
  "ShardInstanceCount=$SHARD_INSTANCE_COUNT"
  "BackupRetentionPeriod=$BACKUP_RETENTION"
)

if [[ -n "$KMS_KEY_ID" ]]; then
  PARAMS+=("KmsKeyId=$KMS_KEY_ID")
fi

if [[ -n "$APP_SG_ID" ]]; then
  PARAMS+=("AppSecurityGroupId=$APP_SG_ID")
elif [[ -n "$INGRESS_CIDR" ]]; then
  PARAMS+=("IngressCidr=$INGRESS_CIDR")
fi

echo "Deploying Elastic DocumentDB stack '$STACK_NAME' to region '$REGION'..."
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides "${PARAMS[@]}" \
  --tags Project=GeneticsPlatform Component=DocDBElastic

echo "✅ Deployment complete. Fetching stack outputs..."
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

ENDPOINT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='ClusterEndpoint'].OutputValue" --output text)
ADMIN_USER=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='AdminUserNameOut'].OutputValue" --output text)
SECRET_ARN=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='AdminSecretArn'].OutputValue" --output text)

cat <<EOF

Next steps

- Place backend env file at: user-backend/.env
- Download TLS CA bundle into user-backend directory:
  curl -o user-backend/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

Suggested user-backend/.env (production)

AWS_REGION=$REGION
NODE_ENV=production
DB_NAME=animal_genetics
DOCUMENTDB_TLS=true
DOCUMENTDB_CA_FILE=./global-bundle.pem

# Option A (recommended): set a full connection string (uses endpoint below)
# Note: Elastic DocDB connection string does not require replicaSet or readPreference params
DOCUMENTDB_URI=mongodb://$ADMIN_USER:<password>@$ENDPOINT:27017/?tls=true&tlsCAFile=global-bundle.pem&retryWrites=false

# Option B: keep password in Secrets Manager (string secret). Fetch at runtime and compose DOCUMENTDB_URI.
DOCDB_ELASTIC_ADMIN_SECRET_ARN=$SECRET_ARN

Fetch the admin password from Secrets Manager (string value):
aws secretsmanager get-secret-value \
  --region $REGION \
  --secret-id "$SECRET_ARN" \
  --query 'SecretString' \
  --output text

EOF
