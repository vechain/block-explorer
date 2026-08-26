################################################################################
# Environment Configuration
################################################################################

# Pull in workspace-specific environment settings from yaml file
# Can then be used as local.env.<key> in other files
locals {
  env = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
}

