# Set account-wide variables. These are automatically pulled in to configure the remote state bucket in the root
# terragrunt.hcl configuration.
locals {
  account_name   = "explorer-dev"
  aws_account_id = "891377394468" # TODO: replace me with your AWS account ID!
  aws_profile    = "explorer-dev"
}
