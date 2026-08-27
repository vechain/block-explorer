terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Pinned, not passed: environments/prod/backend.config now names the new account.
  backend "s3" {
    bucket  = "block-explorer-terraform-state-prod"
    key     = "frontend/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}

provider "aws" {
  region = "eu-west-1"

  default_tags {
    tags = {
      Project     = "block-explorer"
      Environment = local.env.environment
      ManagedBy   = "terraform"
      Workspace   = terraform.workspace
    }
  }
}

