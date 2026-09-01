provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "cdn"
    }
  }
}

# A CloudFront-scope Web ACL and a certificate CloudFront can attach both exist only here.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "cdn"
    }
  }
}

# The zones are in the dev account either way: the same credentials in dev, the role dns/ owns
# in prod.
provider "aws" {
  alias  = "dns"
  region = var.aws_region

  dynamic "assume_role" {
    for_each = var.dns_role_arn == "" ? [] : [var.dns_role_arn]

    content {
      role_arn     = assume_role.value
      session_name = "block-explorer-cdn"
    }
  }

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "cdn"
    }
  }
}
