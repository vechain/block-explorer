# ---------------------------------------------------------------------------------------------------------------------
# COMMON TERRAGRUNT CONFIGURATION
# This is the common component configuration for ecs-cluster. The common variables for each environment to
# deploy ecs-cluster are defined here. This configuration will be merged into the environment configuration
# via an include block.
# ---------------------------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------------------------
# Locals are named constants that are reusable within the configuration.
# ---------------------------------------------------------------------------------------------------------------------
locals {
  # Automatically load environment-level variables
  environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  region_env_vars = read_terragrunt_config(find_in_parent_folders("region.hcl"))


  # Extract out common variables for reuse
  env = local.environment_vars.locals.env
  project = local.environment_vars.locals.project 
  region = local.region_env_vars.locals.aws_region

  # Expose the base source URL so different versions of the module can be deployed in different env
  base_source_url = "git::git@github.com:vechainfoundation/terraform_infrastructure_modules.git//s3-static-cloudfront-hosting"

}



# ---------------------------------------------------------------------------------------------------------------------
# MODULE PARAMETERS
# These are the variables we have to pass in to use the module. This defines the parameters that are common across all
# environments.
# ---------------------------------------------------------------------------------------------------------------------
inputs = {
  env        = local.env
  project    = local.project 
  region       = local.region
   create_logging_bucket = true
    bucket_prefix = local.env == "prod" ? "vechain-block-explorer" : "${local.env}-vechain-block-explorer"
    origin_id   = local.env == "prod" ? "block-explorer.explore.vechain.org" : "block-explorer.dev.explore.vechain.org"
    bucket_name           = local.env == "prod" ? "vechain-block-explorer" : "${local.env}-vechain-block-explorer"
    domain_name = local.env == "prod" ? "block-explorer.explore.vechain.org" : "block-explorer.dev.explore.vechain.org"
    block_public = false
}