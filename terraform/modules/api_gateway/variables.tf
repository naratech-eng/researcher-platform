variable "api_name" {
  type = string
}

variable "api_description" {
  type    = string
  default = ""
}

variable "domain_name" {
  type = string
}

variable "certificate_arn" {
  type    = string
  default = ""
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "service_discovery_service_arn" {
  type = string
}

variable "cors_allow_origins" {
  type    = list(string)
  default = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
