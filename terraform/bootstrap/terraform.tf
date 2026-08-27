terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # bucket comes from -backend-config=../environments/prod/backend.config, and is
  # the one bucket in this repo created outside Terraform — it holds the state
  # that would manage it. See README.md.
  backend "s3" {
    key          = "bootstrap/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}
