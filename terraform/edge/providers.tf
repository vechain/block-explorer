provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "edge"
    }
  }
}

# The zones are in the dev account, so the alias record goes through this
# provider. Configured now, so phase 7 is a record change, not a plumbing one.
provider "aws" {
  alias  = "dns"
  region = var.aws_region

  dynamic "assume_role" {
    for_each = var.dns_role_arn == "" ? [] : [var.dns_role_arn]

    content {
      role_arn     = assume_role.value
      session_name = "block-explorer-edge"
    }
  }

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "edge"
    }
  }
}
