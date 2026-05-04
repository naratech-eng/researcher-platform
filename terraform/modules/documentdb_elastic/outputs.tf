output "cluster_arn" {
  value = aws_docdbelastic_cluster.this.arn
}

output "cluster_endpoint" {
  value = aws_docdbelastic_cluster.this.endpoint
}

output "admin_secret_arn" {
  value = local.admin_secret_arn
}

output "security_group_id" {
  value = aws_security_group.docdb.id
}
