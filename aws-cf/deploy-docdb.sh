#!/usr/bin/env bash
set -euo pipefail

REGION="${REGION:-us-east-2}"
STACK_NAME="${STACK_NAME:-genetics-docdb}"
TEMPLATE="docdb-userdata-stack.yml"

# Required inputs
VPC_ID="${VPC_ID:-}"
SUBNET_IDS="${SUBNET_IDS:-}" # Comma-separated: subnet-aaa,subnet-bbb

# Optional ingress options (choose one)
APP_SG_ID="${APP_SG_ID:-}"   # Security Group ID of app needing access
INGRESS_CIDR="${INGRESS_CIDR:-}" # e.g., 10.0.0.0/16

# Optional overrides
DB_CLUSTER_ID="${DB_CLUSTER_ID:-user-data-docdb}"
DOCDB_INSTANCE_CLASS="${DOCDB_INSTANCE_CLASS:-db.t3.medium}"
DOCDB_ENGINE_VERSION="${DOCDB_ENGINE_VERSION:-5.0}"
MASTER_USERNAME="${MASTER_USERNAME:-docdbadmin}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
DELETION_PROTECTION="${DELETION_PROTECTION:-true}"

if [[ -z "$VPC_ID" || -z "$SUBNET_IDS" ]]; then
  echo "ERROR: Please export VPC_ID and SUBNET_IDS (comma-separated)." >&2
  echo "Example: export VPC_ID=vpc-123456; export SUBNET_IDS=subnet-aaa,subnet-bbb" >&2
  exit 1
fi

PARAMS=(
  "VpcId=$VPC_ID"
  "SubnetIds=$SUBNET_IDS"
  "DBClusterIdentifier=$DB_CLUSTER_ID"
  "DocDBInstanceClass=$DOCDB_INSTANCE_CLASS"
  "DocDBEngineVersion=$DOCDB_ENGINE_VERSION"
  "MasterUsername=$MASTER_USERNAME"
  "BackupRetentionPeriod=$BACKUP_RETENTION"
  "DeletionProtection=$DELETION_PROTECTION"
)

if [[ -n "$APP_SG_ID" ]]; then
  PARAMS+=("AppSecurityGroupId=$APP_SG_ID")
elif [[ -n "$INGRESS_CIDR" ]]; then
  PARAMS+=("IngressCidr=$INGRESS_CIDR")
fi

echo "Deploying DocumentDB stack '$STACK_NAME' to region '$REGION'..."
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --parameter-overrides "${PARAMS[@]}" \
  --tags Project=GeneticsPlatform Component=DocDB

echo "✅ Deployment complete. Fetching stack outputs..."
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

ENDPOINT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DBClusterEndpoint'].OutputValue" --output text)
PORT=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DBPort'].OutputValue" --output text)
SECRET_ARN=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='MasterSecretArn'].OutputValue" --output text)

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

# Option A (recommended now): set a full connection string (uses endpoint below)
DOCUMENTDB_URI=mongodb://<username>:<password>@$ENDPOINT:$PORT/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# Option B: keep creds in Secrets Manager for app to fetch at runtime (requires code)
DOCDB_SECRET_ARN=$SECRET_ARN

Fetch master credentials JSON from Secrets Manager (contains username and password):
aws secretsmanager get-secret-value \
  --region $REGION \
  --secret-id "$SECRET_ARN" \
  --query 'SecretString' \
  --output text

EOF
