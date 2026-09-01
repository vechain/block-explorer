provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "observability-aws"
    }
  }
}

# CloudFront and its CLOUDFRONT-scope WAF publish metrics only here, and an alarm can only act on
# a topic in its own region — so the topic those alarms notify lives here too.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "observability-aws"
    }
  }
}
