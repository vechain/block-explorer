locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  env          = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  preview      = yamldecode(file("../environments/preview/preview.yaml"))
  name         = "${var.project}-${terraform.workspace}"

  # Which prefix in the bucket answers, pinned per environment exactly as image_tag is.
  bundle_prefix = lookup(local.env, "bundle_prefix", "app-unpublished")

  extra_domain = try(local.env.extra_domain.name, null)

  # Previews live only in explorer-dev, and share its distribution rather than running one each.
  preview_wildcard = terraform.workspace == "dev" ? "*.${local.preview.domain_suffix}" : null

  aliases = compact([local.env.domain, local.extra_domain, local.preview_wildcard])

  # Each alias against the public zone its validation record belongs in.
  alias_zones = merge(
    { (local.env.domain) = var.public_zone_name },
    local.extra_domain == null ? {} : { (local.extra_domain) = local.extra_domain },
    local.preview_wildcard == null ? {} : { (local.preview_wildcard) = local.preview.domain_suffix },
  )

  # The preview wildcard is a bare alias: previews are keyed by host in the store, not in DNS.
  record_names = compact([local.env.domain, local.extra_domain])

  # Preload is sticky, so dev gets a bare one-year max-age and never asks for it.
  hsts_header_value = terraform.workspace == "prod" ? "max-age=63072000; includeSubDomains; preload" : "max-age=31536000"
}
