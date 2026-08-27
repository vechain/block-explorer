provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "acm"
    }
  }
}

# The zone is in the dev account either way, so the record always goes through
# this provider: the same credentials in dev, the role dns/ owns in prod.
provider "aws" {
  alias  = "dns"
  region = var.aws_region

  dynamic "assume_role" {
    for_each = var.dns_role_arn == "" ? [] : [var.dns_role_arn]

    content {
      role_arn     = assume_role.value
      session_name = "block-explorer-acm"
    }
  }

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "acm"
    }
  }
}
