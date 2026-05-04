variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "GeneticsPlatform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Copilot-managed VPC (data source only — do NOT manage in TF)
variable "copilot_vpc_id" {
  description = "VPC ID managed by Copilot (naratech-dev)"
  type        = string
  default     = "vpc-0b7612292bf1bda37"
}

variable "copilot_env_security_group_id" {
  description = "Environment security group ID from Copilot"
  type        = string
  default     = "sg-091aa0b3ffee7b37a"
}

variable "service_discovery_service_arn" {
  description = "CloudMap service ARN for main-backend-internal"
  type        = string
  default     = "arn:aws:servicediscovery:us-east-2:091957636975:service/srv-l62nyza7rj77h4wi"
}

# DocumentDB Elastic
variable "docdb_cluster_name" {
  type    = string
  default = "user-data-docdb-elastic"
}

variable "docdb_admin_username" {
  type    = string
  default = "docdbadmin"
}

variable "docdb_shard_capacity" {
  type    = number
  default = 2
}

variable "docdb_shard_count" {
  type    = number
  default = 1
}

variable "docdb_shard_instance_count" {
  type    = number
  default = 1
}

variable "docdb_backup_retention" {
  type    = number
  default = 7
}

variable "docdb_existing_secret_arn" {
  type        = string
  default     = ""
  description = "Existing Secrets Manager ARN for DocumentDB admin password (import from CloudFormation)"
}

# RDS PostgreSQL
variable "rds_identifier" {
  type    = string
  default = "genetic-pg"
}

variable "rds_db_name" {
  type    = string
  default = "genetic_db"
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "rds_engine_version" {
  type    = string
  default = "15.4"
}

variable "rds_existing_secret_arn" {
  type        = string
  default     = ""
  description = "Existing Secrets Manager ARN for RDS master password (import from CloudFormation)"
}

# DynamoDB
variable "dynamodb_tables" {
  description = "Map of DynamoDB table configurations"
  type = map(object({
    billing_mode   = string
    hash_key       = string
    hash_key_type  = string
    range_key      = optional(string)
    range_key_type = optional(string)
  }))
  default = {
    Users = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "UserId"
      hash_key_type = "S"
    }
    ChatMessages = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "SessionId"
      hash_key_type = "S"
      range_key      = "Timestamp"
      range_key_type = "N"
    }
    ChatSessions = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "UserId"
      hash_key_type = "S"
      range_key      = "SessionId"
      range_key_type = "S"
    }
    NotificationInbox = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "UserId"
      hash_key_type = "S"
      range_key      = "NotifId"
      range_key_type = "S"
    }
    UserIdentities = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "IdentityId"
      hash_key_type = "S"
      range_key      = "UserId"
      range_key_type = "S"
    }
    UserWorkspaces = {
      billing_mode  = "PAY_PER_REQUEST"
      hash_key      = "UserId"
      hash_key_type = "S"
      range_key      = "WorkspaceId"
      range_key_type = "S"
    }
  }
}

# API Gateway
variable "api_name" {
  type    = string
  default = "naratech-main-http"
}

variable "api_description" {
  type    = string
  default = "Public HTTP API for main-backend-internal via VPC Link"
}

variable "api_domain_name" {
  type    = string
  default = "main-api.naratech.xyz"
}

variable "api_certificate_arn" {
  description = "ACM certificate ARN for main-api.naratech.xyz"
  type        = string
  default     = ""
}

variable "cors_allow_origins" {
  type    = list(string)
  default = [
    "https://app.naratech.xyz",
    "https://dev-app.naratech.xyz",
    "http://localhost:5173"
  ]
}
