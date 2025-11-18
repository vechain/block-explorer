terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration is partially configured here
  # The bucket is provided via backend config file during init
  backend "s3" {
    key            = "frontend/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    # bucket are provided via -backend-config flag
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

