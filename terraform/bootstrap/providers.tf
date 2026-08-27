provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "bootstrap"
    }
  }
}
