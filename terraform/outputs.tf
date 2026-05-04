output "copilot_vpc_id" {
  description = "Copilot-managed VPC ID"
  value       = module.vpc_data.vpc_id
}

output "copilot_private_subnet_ids" {
  description = "Private subnets from Copilot VPC"
  value       = module.vpc_data.private_subnet_ids
}

output "copilot_public_subnet_ids" {
  description = "Public subnets from Copilot VPC"
  value       = module.vpc_data.public_subnet_ids
}

output "documentdb_cluster_arn" {
  description = "DocumentDB Elastic cluster ARN"
  value       = module.documentdb_elastic.cluster_arn
}

output "documentdb_endpoint" {
  description = "DocumentDB Elastic cluster endpoint"
  value       = module.documentdb_elastic.cluster_endpoint
}

output "documentdb_secret_arn" {
  description = "Secrets Manager ARN for DocumentDB admin password"
  value       = module.documentdb_elastic.admin_secret_arn
}

output "documentdb_security_group_id" {
  description = "Security group ID for DocumentDB"
  value       = module.documentdb_elastic.security_group_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds_postgres.db_endpoint
}

output "rds_secret_arn" {
  description = "Secrets Manager ARN for RDS master password"
  value       = module.rds_postgres.master_secret_arn
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = module.rds_postgres.security_group_id
}

output "dynamodb_table_names" {
  description = "Names of managed DynamoDB tables"
  value       = module.dynamodb.table_names
}

output "api_gateway_id" {
  description = "API Gateway HTTP API ID"
  value       = module.api_gateway.api_id
}

output "api_gateway_domain_name" {
  description = "API Gateway custom domain name"
  value       = module.api_gateway.domain_name
}

output "api_gateway_domain_target" {
  description = "API Gateway domain CloudFront target"
  value       = module.api_gateway.domain_target
}
