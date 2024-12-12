# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
locals {
  env = "dev"
  project = "block-explorer"
  internal_url_name = "dev.blockexplorer.local"

#common values for services
  cpu = 256
  memory = 512
  desired_capacity = 1

#certificate for *.dev.explore.vechain.org

  certificate_arn = "arn:aws:acm:eu-west-1:891377394468:certificate/5d905fcf-9e18-4aeb-b2ff-ce5dec9b69dd"
  kms_key_id              = "25bc36b0-b0cf-41b3-8836-ef089118a967"

}
