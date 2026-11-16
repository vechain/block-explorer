terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    # No resource uses it any more, but the prod state still holds the old Grafana token's
    # time_rotating, and init runs before the workspace is selected, so it would not be installed.
    # Drop it once no state lists hashicorp/time.
    time = {
      source  = "hashicorp/time"
      version = "~> 0.14"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # bucket comes from -backend-config=../environments/<env>/backend.config
  backend "s3" {
    key          = "observability-aws/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}
