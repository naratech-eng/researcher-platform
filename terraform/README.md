# Terraform — Shared Services

Manages AWS shared infrastructure while keeping ECS/Fargate deployments in AWS Copilot.

## Scope

**Terraform manages:**
- DocumentDB Elastic (`genetics-docdb-elastic`)
- RDS PostgreSQL (`genetics-postgres`)
- DynamoDB tables (`genetics-dynamodb`)
- API Gateway HTTP API + VPC Link + custom domain (`main-api.naratech.xyz`)

**Copilot manages:**
- ECS cluster, services, and task definitions
- VPC, subnets, IGW, route tables (`naratech-dev` environment)
- Service discovery namespace
- ALBs (if any Load Balanced Web Services)

## Prerequisites

1. AWS CLI configured with `deploy-user` profile
2. Terraform >= 1.5.0 installed

## First-time Setup

### 1. Bootstrap S3 Backend

```bash
cd terraform
chmod +x bootstrap.sh
AWS_PROFILE=deploy-user ./bootstrap.sh
```

This creates:
- S3 bucket: `naratech-terraform-state-<account-id>-us-east-2`
- DynamoDB table: `naratech-terraform-locks`

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Import Existing Resources

All shared resources were previously created via CloudFormation. Import them into Terraform state to avoid recreation:

```bash
chmod +x import.sh
./import.sh
```

### 4. Verify Zero Drift

```bash
terraform plan
```

You should see **no changes** (or only minor tag/ordering diffs). If you see resource recreation, do NOT apply — fix the Terraform code first.

### 5. Apply (when ready)

After confirming plan shows only expected changes:

```bash
terraform apply
```

## Resource Inventory

| Resource | Stack | Import ID |
|---|---|---|
| DocumentDB Elastic | `genetics-docdb-elastic` | `arn:aws:docdb-elastic:us-east-2:091957636975:cluster/06baa511-cfeb-485d-9091-422873fe5dcb` |
| DocDB Security Group | `genetics-docdb-elastic` | `sg-0fa785c041a1d9441` |
| RDS PostgreSQL | `genetics-postgres` | `genetic-pg` |
| RDS Subnet Group | `genetics-postgres` | `genetics-postgres-postgressubnetgroup-uvymyticibyv` |
| RDS Security Group | `genetics-postgres` | `sg-0713969b7db98f5ed` |
| DynamoDB Tables | `genetics-dynamodb` | Table names: `Users`, `ChatMessages`, `ChatSessions`, `NotificationInbox`, `UserIdentities`, `UserWorkspaces` |
| API Gateway | Manual/Copilot | `b3uk8892mh` |
| VPC Link | Manual | `8969kd` |
| Custom Domain | Manual | `main-api.naratech.xyz` |

## Secrets Handling

DocumentDB and RDS passwords are stored in **Secrets Manager** and were created by CloudFormation.

To prevent Terraform from rotating passwords during migration:
- `terraform.tfvars` sets `docdb_existing_secret_arn` and `rds_existing_secret_arn`
- Terraform modules reference these as data sources and do **not** create new `random_password` resources when an existing ARN is provided
- After migration is stable, you can remove the `existing_secret_arn` variables and let Terraform manage secrets directly

## Post-Migration

Once all resources are imported and verified:
1. Delete the old CloudFormation stacks (Terraform now owns the resources):
   - `genetics-docdb-elastic`
   - `genetics-postgres`
   - `genetics-dynamodb`
   > **WARNING:** Only delete CF stacks AFTER `terraform apply` succeeds and resources are confirmed stable.
2. Archive or delete unused `aws-cf/` templates: `ec2-airflow-stack.yml`, `docdb-userdata-stack.yml`, etc.
