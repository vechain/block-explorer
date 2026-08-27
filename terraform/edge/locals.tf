locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  env          = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name         = "${var.project}-${terraform.workspace}"

  # Preload is sticky, so dev gets a bare one-year max-age and never asks for it.
  hsts_header_value = terraform.workspace == "prod" ? "max-age=63072000; includeSubDomains; preload" : "max-age=31536000"

  # Null leaves a simple record, which is what dev owns outright.
  dns_weight = lookup(local.env, "dns_weight", null)
}
