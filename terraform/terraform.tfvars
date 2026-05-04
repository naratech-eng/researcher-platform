aws_region     = "us-east-2"
project_name   = "GeneticsPlatform"
environment    = "dev"

copilot_vpc_id                = "vpc-0b7612292bf1bda37"
copilot_env_security_group_id = "sg-091aa0b3ffee7b37a"
service_discovery_service_arn = "arn:aws:servicediscovery:us-east-2:091957636975:service/srv-l62nyza7rj77h4wi"

# DocumentDB Elastic overrides (if any)
docdb_cluster_name = "user-data-docdb-elastic"
docdb_existing_secret_arn = "arn:aws:secretsmanager:us-east-2:091957636975:secret:genetics-docdb-elastic-DocDBElasticAdminPassword-e0Khu1"

# RDS PostgreSQL overrides (if any)
rds_identifier = "genetic-pg"
rds_db_name    = "genetic_db"
rds_existing_secret_arn = "arn:aws:secretsmanager:us-east-2:091957636975:secret:genetics-postgres-PostgresMasterSecret-e5wQ4E"

# API Gateway
api_certificate_arn = "arn:aws:acm:us-east-2:091957636975:certificate/4b7dc026-d88e-4b7a-a09b-32faf2c89f8f"
cors_allow_origins = [
  "https://app.naratech.xyz",
  "https://dev-app.naratech.xyz",
  "http://localhost:5173"
]
