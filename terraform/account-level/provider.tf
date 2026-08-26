terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "block-explorer-terraform-state-prod"
    key     = "account-level/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Project   = "block-explorer"
      ManagedBy = "terraform"
    }
  }
}

# Provider for us-east-1 (required for ACM certificates for CloudFront/global services)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "block-explorer"
      ManagedBy = "terraform"
    }
  }
}
