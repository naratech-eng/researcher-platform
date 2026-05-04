output "db_endpoint" {
  value = aws_db_instance.this.endpoint
}

output "db_address" {
  value = aws_db_instance.this.address
}

output "db_name" {
  value = aws_db_instance.this.db_name
}

output "master_secret_arn" {
  value = var.existing_secret_arn != "" ? var.existing_secret_arn : aws_secretsmanager_secret.master_password[0].arn
}

output "security_group_id" {
  value = aws_security_group.rds.id
}

output "subnet_group_name" {
  value = aws_db_subnet_group.this.name
}
