provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project
      # "preview", never the pr-N workspace — not dev's resources.
      Environment = local.env.environment
      ManagedBy   = "terraform"
      Module      = "frontend-preview"
      PrPreview   = "pr-${var.pr_number}"
    }
  }
}
