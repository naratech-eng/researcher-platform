variable "identifier" {
  type = string
}

variable "db_name" {
  type = string
}

variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "engine_version" {
  type    = string
  default = "15.4"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "storage_type" {
  type    = string
  default = "gp2"
}

variable "master_username" {
  type    = string
  default = "postgres"
}

variable "parameter_group_name" {
  type    = string
  default = "default.postgres15"
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
}

variable "existing_secret_arn" {
  type        = string
  default     = ""
  description = "Existing Secrets Manager ARN for master password. If provided, module will NOT create a new secret."
}

variable "tags" {
  type    = map(string)
  default = {}
}
