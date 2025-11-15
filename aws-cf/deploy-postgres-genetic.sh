#!/usr/bin/env bash
set -euo pipefail

REGION="${REGION:-us-east-2}"
STACK_NAME="${STACK_NAME:-genetics-postgres}"
TEMPLATE="postgres-genetic-stack.yml"

# Required input
VPC_ID="${VPC_ID:-}"

# Optional overrides
SUBNET_IDS="${SUBNET_IDS:-}"          # Comma-separated: subnet-aaa,subnet-bbb (if omitted, autodiscovered)
APP_SG_ID="${APP_SG_ID:-}"           # Optional SG ID for an app (ECS, Lambda, etc.) needing DB access
ALLOWED_CIDR="${ALLOWED_CIDR:-0.0.0.0/0}" # Public for now; tighten later to your IP or SG-only

DB_INSTANCE_ID="${DB_INSTANCE_ID:-genetic-pg}"
DB_NAME="${DB_NAME:-genetic_db}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
MASTER_USERNAME="${MASTER_USERNAME:-genetic_admin}"
ALLOCATED_STORAGE="${ALLOCATED_STORAGE:-20}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
MULTI_AZ="${MULTI_AZ:-false}"
DELETION_PROTECTION="${DELETION_PROTECTION:-false}"

if [[ -z "$VPC_ID" ]]; then
  echo "ERROR: Please export VPC_ID for the target VPC." >&2
  echo "Example: export VPC_ID=vpc-0b7612292bf1bda37" >&2
  exit 1
fi

if [[ -z "$SUBNET_IDS" ]]; then
  echo "Discovering subnets in VPC $VPC_ID (region: $REGION)..." >&2
  # Fetch all subnet IDs in the VPC and join as comma-separated list
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --region "$REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].SubnetId' \
    --output text | tr '\t' ',')

  if [[ -z "$SUBNET_IDS" ]]; then
    echo "ERROR: No subnets found in VPC $VPC_ID" >&2
    exit 1
  fi

  echo "Using subnets: $SUBNET_IDS" >&2
fi

PARAMS=(
  "VpcId=$VPC_ID"
  "SubnetIds=$SUBNET_IDS"
  "DBInstanceIdentifier=$DB_INSTANCE_ID"
  "DBName=$DB_NAME"
  "DBPort=5432"
  "DBInstanceClass=$DB_INSTANCE_CLASS"
  "MasterUsername=$MASTER_USERNAME"
  "AllocatedStorage=$ALLOCATED_STORAGE"
  "BackupRetentionPeriod=$BACKUP_RETENTION"
  "MultiAZ=$MULTI_AZ"
  "DeletionProtection=$DELETION_PROTECTION"
  "AllowedCidr=$ALLOWED_CIDR"
)

if [[ -n "$APP_SG_ID" ]]; then
  PARAMS+=("AppSecurityGroupId=$APP_SG_ID")
fi

echo "Deploying PostgreSQL stack '$STACK_NAME' to region '$REGION'..." >&2
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides "${PARAMS[@]}" \
  --tags Project=GeneticsPlatform Component=Postgres

echo "✅ Deployment complete. Fetching stack outputs..." >&2
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

ENDPOINT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DBEndpointAddress'].OutputValue" --output text)
PORT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DBEndpointPort'].OutputValue" --output text)
SECRET_ARN=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='MasterSecretArn'].OutputValue" --output text)
DB_NAME_OUT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DBName'].OutputValue" --output text)

cat <<EOF

Next steps

- Fetch master credentials JSON from Secrets Manager (contains username and password):

  aws secretsmanager get-secret-value \
    --region $REGION \
    --secret-id "$SECRET_ARN" \
    --query 'SecretString' \
    --output text | jq .

- Example psql connection string (adjust username and password):

  export PGPASSWORD='<password_from_secret>'
  psql "postgresql://genetic_admin@$ENDPOINT:$PORT/$DB_NAME_OUT?sslmode=require"

- For local development, ALLOWED_CIDR is currently set to: $ALLOWED_CIDR
  You can later tighten this to your IP (e.g., x.x.x.x/32) or rely solely on AppSecurityGroupId.

EOF
