provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project
      # "preview", not the dev workspace this applies in. YACE discovers by
      # Environment=^dev$, so this is what keeps preview traffic out of dev's
      # ALB rules and preview tasks out of EcsTaskDrift.
      Environment = local.env.environment
      ManagedBy   = "terraform"
      Module      = "preview-edge"
    }
  }
}
