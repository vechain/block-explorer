locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  env          = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name         = "${var.project}-${terraform.workspace}"

  okta_saml_ready = local.env.grafana_okta_saml_metadata_url != "" && length(local.env.grafana_admin_okta_groups) > 0 && length(local.env.grafana_editor_okta_groups) > 0

  # Gates evaluation, not just delivery. See the README.
  alerts_enabled = local.env.alerts_enabled
}
