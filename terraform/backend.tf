terraform {
  backend "s3" {
    bucket         = "naratech-terraform-state-091957636975-us-east-2"
    key            = "shared-services/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "naratech-terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.5.0"
}
