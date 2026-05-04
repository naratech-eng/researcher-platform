variable "tables" {
  description = "Map of DynamoDB table configurations"
  type = map(object({
    billing_mode   = string
    hash_key       = string
    hash_key_type  = string
    range_key      = optional(string)
    range_key_type = optional(string)
  }))
}

variable "tags" {
  type    = map(string)
  default = {}
}
