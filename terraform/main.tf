provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and networking data sources (managed by Copilot — do NOT import/modify)
module "vpc_data" {
  source = "./modules/vpc_data"

  vpc_id = var.copilot_vpc_id
}

# DocumentDB Elastic (user data backend)
module "documentdb_elastic" {
  source = "./modules/documentdb_elastic"

  cluster_name       = var.docdb_cluster_name
  admin_username     = var.docdb_admin_username
  shard_capacity     = var.docdb_shard_capacity
  shard_count        = var.docdb_shard_count
  shard_instance_count = var.docdb_shard_instance_count
  backup_retention   = var.docdb_backup_retention

  vpc_id             = var.copilot_vpc_id
  subnet_ids         = module.vpc_data.private_subnet_ids
  app_security_group_id = var.copilot_env_security_group_id
  existing_secret_arn = var.docdb_existing_secret_arn

  tags = {
    Component = "DocDBElastic"
  }
}

# RDS PostgreSQL (genetics data)
module "rds_postgres" {
  source = "./modules/rds_postgres"

  identifier     = var.rds_identifier
  db_name        = var.rds_db_name
  instance_class = var.rds_instance_class
  engine_version = var.rds_engine_version

  vpc_id     = var.copilot_vpc_id
  subnet_ids = module.vpc_data.private_subnet_ids
  app_security_group_id = var.copilot_env_security_group_id
  existing_secret_arn = var.rds_existing_secret_arn

  tags = {
    Component = "RDS"
  }
}

# DynamoDB tables (genetics platform)
module "dynamodb" {
  source = "./modules/dynamodb"

  tables = var.dynamodb_tables
}

# API Gateway + VPC Link (public HTTP API for main-backend-internal)
module "api_gateway" {
  source = "./modules/api_gateway"

  api_name       = var.api_name
  api_description  = var.api_description
  domain_name    = var.api_domain_name
  certificate_arn = var.api_certificate_arn

  vpc_id      = var.copilot_vpc_id
  subnet_ids  = module.vpc_data.private_subnet_ids
  security_group_ids = [var.copilot_env_security_group_id]

  # Service discovery target for main-backend-internal
  service_discovery_service_arn = var.service_discovery_service_arn

  # CORS origins matching frontend domains
  cors_allow_origins = var.cors_allow_origins

  tags = {
    Component = "APIGateway"
  }
}
