provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      ManagedBy   = "terraform"
      Module      = "observability-grafana"
    }
  }
}

# Points at the AMG workspace observability-aws created, authenticating with the
# service-account token it minted. Both are null on a first deploy, hence the
# placeholders — every grafana_* resource is count-gated on observability_ready,
# so the provider is never actually called against them.
provider "grafana" {
  url  = "https://${coalesce(local.amg_workspace_endpoint, "placeholder.invalid")}"
  auth = coalesce(local.amg_service_account_token, "placeholder")
}
