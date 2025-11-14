################################################################################
# Data Sources
################################################################################

# Fetch account-level outputs from state
data "terraform_remote_state" "account_level" {
  backend = "s3"
  config = {
    bucket = "block-explorer-terraform-state-prod"
    key    = "env:/prod/account-level/terraform.tfstate"
    region = "eu-west-1"
  }
}

# Current AWS account details
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
