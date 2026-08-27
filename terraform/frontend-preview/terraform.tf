terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # bucket comes from -backend-config=../environments/preview/backend.config.
  # State lands at env:/pr-<N>/frontend-preview/terraform.tfstate, so one PR's
  # apply or destroy can never touch another's.
  backend "s3" {
    key          = "frontend-preview/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}
