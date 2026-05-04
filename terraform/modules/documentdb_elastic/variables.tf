variable "cluster_name" {
  type = string
}

variable "admin_username" {
  type    = string
  default = "docdbadmin"
}

variable "shard_capacity" {
  type    = number
  default = 2
}

variable "shard_count" {
  type    = number
  default = 1
}

variable "shard_instance_count" {
  type    = number
  default = 1
}

variable "backup_retention" {
  type    = number
  default = 7
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "app_security_group_id" {
  type    = string
  default = ""
  description = "Security group ID of the application that needs access"
}

variable "existing_secret_arn" {
  type        = string
  default     = ""
  description = "Existing Secrets Manager ARN for admin password. If provided, module will NOT create a new secret."
}

variable "tags" {
  type    = map(string)
  default = {}
}
