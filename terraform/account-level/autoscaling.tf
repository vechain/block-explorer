################################################################################
# Shared App Runner Auto Scaling Configurations
################################################################################
# 
# These are shared auto scaling configurations used by all App Runner services.
# AWS limits accounts to 10 unique auto scaling configuration names, so we create
# reusable configurations here instead of per-environment.
#
# See: https://docs.aws.amazon.com/apprunner/latest/dg/manage-autoscaling.html
################################################################################

# Production auto scaling configuration
# Used by the production App Runner service
resource "aws_apprunner_auto_scaling_configuration_version" "prod" {
  auto_scaling_configuration_name = "block-explorer-prod"

  max_concurrency = 100
  min_size        = 1  # Always warm, no cold starts
  max_size        = 10 # Scale up under load

  tags = {
    Name        = "block-explorer-prod"
    Environment = "prod"
    Purpose     = "Production auto scaling for Block Explorer"
  }
}

# Preview auto scaling configuration
# Shared by ALL preview environments to avoid hitting the 10-name quota
resource "aws_apprunner_auto_scaling_configuration_version" "preview" {
  auto_scaling_configuration_name = "block-explorer-preview"

  max_concurrency = 100
  min_size        = 1 # App Runner requires minimum 1
  max_size        = 2 # Limited scaling for previews

  tags = {
    Name        = "block-explorer-preview"
    Environment = "preview"
    Purpose     = "Shared auto scaling for all Block Explorer preview environments"
  }
}

