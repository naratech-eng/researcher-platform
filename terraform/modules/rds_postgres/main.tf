locals {
  name_prefix = var.identifier
}

# Security group for RDS PostgreSQL
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, { Name = "${local.name_prefix}-RDS-SG" })
}

resource "aws_security_group_rule" "rds_from_app_sg" {
  count                    = var.app_security_group_id != "" ? 1 : 0
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.app_security_group_id
  security_group_id        = aws_security_group.rds.id
  description              = "Allow PostgreSQL access from application SG"
}

resource "aws_security_group_rule" "rds_from_vpc" {
  count             = var.app_security_group_id == "" ? 1 : 0
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.target.cidr_block]
  security_group_id = aws_security_group.rds.id
  description       = "Allow PostgreSQL access from VPC CIDR"
}

# DB subnet group
resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, { Name = "${local.name_prefix}-subnet-group" })
}

# Master password secret (only created if no existing secret provided)
resource "aws_secretsmanager_secret" "master_password" {
  count       = var.existing_secret_arn != "" ? 0 : 1
  name_prefix = "${local.name_prefix}-PostgresMasterSecret"
  description = "Master password for RDS PostgreSQL"

  tags = merge(var.tags, { Name = "${local.name_prefix}-PostgresMasterSecret" })
}

resource "aws_secretsmanager_secret_version" "master_password" {
  count         = var.existing_secret_arn != "" ? 0 : 1
  secret_id     = aws_secretsmanager_secret.master_password[0].id
  secret_string = random_password.master_password[0].result
}

resource "random_password" "master_password" {
  count            = var.existing_secret_arn != "" ? 0 : 1
  length           = 30
  special          = false
  numeric          = true
  upper            = true
  lower            = true
}

# RDS PostgreSQL instance
resource "aws_db_instance" "this" {
  identifier             = var.identifier
  allocated_storage      = var.allocated_storage
  storage_type           = var.storage_type
  engine                 = "postgres"
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  db_name                = var.db_name
  username               = var.master_username
  password               = var.existing_secret_arn != "" ? data.aws_secretsmanager_secret.existing[0].secret_string : aws_secretsmanager_secret_version.master_password[0].secret_string
  parameter_group_name   = var.parameter_group_name
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = var.backup_retention

  tags = merge(var.tags, { Name = var.identifier })
}

data "aws_secretsmanager_secret" "existing" {
  count = var.existing_secret_arn != "" ? 1 : 0
  arn   = var.existing_secret_arn
}

data "aws_vpc" "target" {
  id = var.vpc_id
}
