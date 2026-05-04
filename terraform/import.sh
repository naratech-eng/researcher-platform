#!/usr/bin/env bash
set -euo pipefail

# Import existing AWS resources into Terraform state
# Run this AFTER 'terraform init' but BEFORE 'terraform apply'
# These IDs were collected from live AWS resources on 2026-05-03

echo "=== Importing DocumentDB Elastic ==="
terraform import 'module.documentdb_elastic.aws_docdbelastic_cluster.this' 'arn:aws:docdb-elastic:us-east-2:091957636975:cluster/06baa511-cfeb-485d-9091-422873fe5dcb'
terraform import 'module.documentdb_elastic.aws_security_group.docdb' 'sg-0fa785c041a1d9441'

echo "=== Importing RDS PostgreSQL ==="
terraform import 'module.rds_postgres.aws_db_instance.this' 'genetic-pg'
terraform import 'module.rds_postgres.aws_db_subnet_group.this' 'genetics-postgres-postgressubnetgroup-uvymyticibyv'
terraform import 'module.rds_postgres.aws_security_group.rds' 'sg-0713969b7db98f5ed'

echo "=== Importing DynamoDB tables ==="
terraform import 'module.dynamodb.aws_dynamodb_table.this["Users"]' 'Users'
terraform import 'module.dynamodb.aws_dynamodb_table.this["ChatMessages"]' 'ChatMessages'
terraform import 'module.dynamodb.aws_dynamodb_table.this["ChatSessions"]' 'ChatSessions'
terraform import 'module.dynamodb.aws_dynamodb_table.this["NotificationInbox"]' 'NotificationInbox'
terraform import 'module.dynamodb.aws_dynamodb_table.this["UserIdentities"]' 'UserIdentities'
terraform import 'module.dynamodb.aws_dynamodb_table.this["UserWorkspaces"]' 'UserWorkspaces'

echo "=== Importing API Gateway ==="
terraform import 'module.api_gateway.aws_apigatewayv2_api.this' 'b3uk8892mh'
terraform import 'module.api_gateway.aws_apigatewayv2_vpc_link.this' '8969kd'
terraform import 'module.api_gateway.aws_apigatewayv2_domain_name.this' 'main-api.naratech.xyz'
terraform import 'module.api_gateway.aws_apigatewayv2_stage.prod' 'b3uk8892mh/prod'
terraform import 'module.api_gateway.aws_apigatewayv2_integration.proxy' 'b3uk8892mh/bj0iay4'
terraform import 'module.api_gateway.aws_apigatewayv2_route.proxy' 'b3uk8892mh/myfh24v'
terraform import 'module.api_gateway.aws_apigatewayv2_api_mapping.this' 'b3uk8892mh/main-api.naratech.xyz'

echo ""
echo "=== Import complete. Run 'terraform plan' to verify no changes. ==="
echo "NOTE: Secrets are referenced via existing_secret_arn variables and NOT imported as Terraform-managed resources."
echo "      This prevents Terraform from rotating passwords during migration."
