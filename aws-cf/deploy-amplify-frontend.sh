#!/usr/bin/env bash
set -euo pipefail

REGION=${REGION:-us-east-2}
STACK_NAME=${STACK_NAME:-amplify-frontend}
APP_NAME=${APP_NAME:-ResearcherPlatformFrontend}
REPO_OWNER=${REPO_OWNER:-naratech-eng}
REPO_NAME=${REPO_NAME:-researcher-platform}
PLATFORM_TYPE=${PLATFORM_TYPE:-WEB_COMPUTE}
NODE_VERSION=${NODE_VERSION:-22}
MONOREPO_APP_ROOT=${MONOREPO_APP_ROOT:-frontend}
BRANCH_MAIN_NAME=${BRANCH_MAIN_NAME:-naratech}
BRANCH_DEV_NAME=${BRANCH_DEV_NAME:-dev}
ENABLE_PR_PREVIEWS=${ENABLE_PR_PREVIEWS:-true}
DOMAIN_NAME=${DOMAIN_NAME:-naratech.ca}
PROD_SUBDOMAIN_PREFIX=${PROD_SUBDOMAIN_PREFIX:-platform}
DEV_SUBDOMAIN_PREFIX=${DEV_SUBDOMAIN_PREFIX:-dev}
GITHUB_PAT_SECRET_NAME=${GITHUB_PAT_SECRET_NAME:-researcher-platform/github-pat}
DEV_BASIC_AUTH_SECRET_NAME=${DEV_BASIC_AUTH_SECRET_NAME:-researcher-platform/dev-basic-auth}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GH_SECRET_ARN=$(aws secretsmanager describe-secret --region "$REGION" --secret-id "$GITHUB_PAT_SECRET_NAME" --query ARN --output text 2>/dev/null || echo "")
if [ -z "$GH_SECRET_ARN" ]; then
  if [ -z "${GITHUB_PAT:-}" ]; then
    echo "Set GITHUB_PAT to create secret $GITHUB_PAT_SECRET_NAME"
    exit 1
  fi
  GH_SECRET_ARN=$(aws secretsmanager create-secret --region "$REGION" --name "$GITHUB_PAT_SECRET_NAME" --secret-string "$GITHUB_PAT" --query ARN --output text)
fi

DEV_SECRET_ARN=$(aws secretsmanager describe-secret --region "$REGION" --secret-id "$DEV_BASIC_AUTH_SECRET_NAME" --query ARN --output text 2>/dev/null || echo "")
if [ -z "$DEV_SECRET_ARN" ]; then
  if [ -z "${DEV_BASIC_AUTH_USERNAME:-}" ]; then
    DEV_BASIC_AUTH_USERNAME="dev"
  fi
  if [ -z "${DEV_BASIC_AUTH_PASSWORD:-}" ]; then
    if command -v openssl >/dev/null 2>&1; then
      DEV_BASIC_AUTH_PASSWORD="$(openssl rand -base64 24)"
    else
      DEV_BASIC_AUTH_PASSWORD="$(dd if=/dev/urandom bs=32 count=1 2>/dev/null | base64)"
    fi
  fi
  DEV_SECRET_ARN=$(aws secretsmanager create-secret --region "$REGION" --name "$DEV_BASIC_AUTH_SECRET_NAME" --secret-string "{\"username\":\"$DEV_BASIC_AUTH_USERNAME\",\"password\":\"$DEV_BASIC_AUTH_PASSWORD\"}" --query ARN --output text)
fi

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$SCRIPT_DIR/amplify-frontend.yml" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AppName="$APP_NAME" \
    RepoOwner="$REPO_OWNER" \
    RepoName="$REPO_NAME" \
    PlatformType="$PLATFORM_TYPE" \
    NodeVersion="$NODE_VERSION" \
    MonorepoAppRoot="$MONOREPO_APP_ROOT" \
    BranchMainName="$BRANCH_MAIN_NAME" \
    BranchDevName="$BRANCH_DEV_NAME" \
    EnablePRPreviews="$ENABLE_PR_PREVIEWS" \
    DomainName="$DOMAIN_NAME" \
    ProdSubdomainPrefix="$PROD_SUBDOMAIN_PREFIX" \
    DevSubdomainPrefix="$DEV_SUBDOMAIN_PREFIX" \
    GitHubAccessTokenSecretArn="$GH_SECRET_ARN" \
    DevBasicAuthSecretArn="$DEV_SECRET_ARN" \
    UseAmplifyServiceRole="${UseAmplifyServiceRole:-true}" \
    UseExistingAppId="${UseExistingAppId:-false}" \
    ExistingAppId="${ExistingAppId:-}"

aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output table

echo ""
echo "GitHub PAT secret: $GITHUB_PAT_SECRET_NAME"
echo "Retrieve with: aws secretsmanager get-secret-value --region \"$REGION\" --secret-id \"$GITHUB_PAT_SECRET_NAME\" --query SecretString --output text"
echo ""
echo "Dev Basic Auth secret: $DEV_BASIC_AUTH_SECRET_NAME"
echo "Retrieve with: aws secretsmanager get-secret-value --region \"$REGION\" --secret-id \"$DEV_BASIC_AUTH_SECRET_NAME\" --query SecretString --output text"
