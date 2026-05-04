output "vpc_id" {
  description = "VPC ID"
  value       = data.aws_vpc.copilot.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = data.aws_vpc.copilot.cidr_block
}

output "private_subnet_ids" {
  description = "Private subnet IDs (no public IP on launch)"
  value       = data.aws_subnets.private.ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs (public IP on launch)"
  value       = data.aws_subnets.public.ids
}
