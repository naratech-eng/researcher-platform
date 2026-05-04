locals {
  name_prefix = var.cluster_name
}

# Security group for DocumentDB Elastic
resource "aws_security_group" "docdb" {
  name_prefix = "${local.name_prefix}-sg"
  description = "Security group for Amazon DocumentDB Elastic cluster"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, { Name = "${local.name_prefix}-DocDBElasticSG" })
}

# Ingress from application security group (Copilot ECS tasks)
resource "aws_security_group_rule" "docdb_from_app_sg" {
  count                    = var.app_security_group_id != "" ? 1 : 0
  type                     = "ingress"
  from_port                = 27017
  to_port                  = 27017
  protocol                 = "tcp"
  source_security_group_id = var.app_security_group_id
  security_group_id        = aws_security_group.docdb.id
  description              = "Allow MongoDB access from application SG"
}

# Ingress from VPC CIDR as fallback
resource "aws_security_group_rule" "docdb_from_vpc" {
  count             = var.app_security_group_id == "" ? 1 : 0
  type              = "ingress"
  from_port         = 27017
  to_port           = 27017
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.target.cidr_block]
  security_group_id = aws_security_group.docdb.id
  description       = "Allow MongoDB access from VPC CIDR"
}

# Admin password secret (only created if no existing secret provided)
resource "aws_secretsmanager_secret" "admin_password" {
  count       = var.existing_secret_arn != "" ? 0 : 1
  name_prefix = "${local.name_prefix}-DocDBElasticAdminPassword"
  description = "Password for Elastic DocumentDB admin user (plain string)"

  tags = merge(var.tags, { Name = "${local.name_prefix}-DocDBElasticAdminPassword" })
}

resource "aws_secretsmanager_secret_version" "admin_password" {
  count         = var.existing_secret_arn != "" ? 0 : 1
  secret_id     = aws_secretsmanager_secret.admin_password[0].id
  secret_string = random_password.admin_password[0].result
}

resource "random_password" "admin_password" {
  count   = var.existing_secret_arn != "" ? 0 : 1
  length  = 30
  numeric = true
  upper   = true
  lower   = true
  special = false
}

# DocumentDB Elastic cluster
resource "aws_docdbelastic_cluster" "this" {
  name                 = var.cluster_name
  admin_user_name      = var.admin_username
  admin_user_password  = local.admin_secret_arn
  auth_type            = "SECRET_ARN"
  shard_capacity       = var.shard_capacity
  shard_count          = var.shard_count
  shard_instance_count = var.shard_instance_count
  subnet_ids           = var.subnet_ids
  vpc_security_group_ids = [aws_security_group.docdb.id]
  backup_retention_period = var.backup_retention

  tags = merge(var.tags, { Name = "${local.name_prefix}-DocDBElasticCluster" })
}

data "aws_secretsmanager_secret" "existing" {
  count = var.existing_secret_arn != "" ? 1 : 0
  arn   = var.existing_secret_arn
}

locals {
  admin_secret_arn = var.existing_secret_arn != "" ? data.aws_secretsmanager_secret.existing[0].arn : aws_secretsmanager_secret.admin_password[0].arn
}

data "aws_vpc" "target" {
  id = var.vpc_id
}
