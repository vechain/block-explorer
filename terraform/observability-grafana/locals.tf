locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  name         = "${var.project}-${terraform.workspace}"

  # Pinned by hand so the committed dashboard JSON can name its datasources and
  # keep working across an environment rebuild. Changing one orphans every query
  # in every dashboard that references it.
  datasource_uid_amp        = "amp-${terraform.workspace}"
  datasource_uid_cloudwatch = "cloudwatch-${terraform.workspace}"

  amg_workspace_endpoint         = try(data.terraform_remote_state.observability_aws.outputs.amg_workspace_endpoint, null)
  amg_sa_token_secret_arn        = try(data.terraform_remote_state.observability_aws.outputs.amg_service_account_token_secret_arn, null)
  amg_sa_token_secret_version_id = try(data.terraform_remote_state.observability_aws.outputs.amg_service_account_token_secret_version_id, null)
  amp_prometheus_endpoint        = try(data.terraform_remote_state.observability_aws.outputs.amp_prometheus_endpoint, null)

  amg_service_account_token = try(data.aws_secretsmanager_secret_version.amg_sa_token[0].secret_string, null)

  # CloudFront, its function and its WAF all publish only here, whatever region the stack runs in.
  cloudfront_region = "us-east-1"

  distribution_id      = try(data.terraform_remote_state.cdn.outputs.distribution_id, null)
  router_function_name = try(data.terraform_remote_state.cdn.outputs.router_function_name, null)

  # Falls back to a name that matches nothing, so WAF-off renders empty panels.
  waf_web_acl_name = coalesce(try(data.terraform_remote_state.cdn.outputs.waf_web_acl_name, null), "waf-disabled")

  # Rule dimension values are visibility_config metric names, not terraform rule names.
  waf_rule_prefix = "${local.name}-waf-cdn"

  waf_log_group = coalesce(try(data.terraform_remote_state.cdn.outputs.waf_log_group_name, null), "waf-disabled")

  # Version ID, not the token: a boolean off a sensitive value is sensitive too.
  observability_ready = local.amg_workspace_endpoint != null && local.amg_sa_token_secret_version_id != null && local.amp_prometheus_endpoint != null

  # Every panel names a distribution, so the dashboard waits on cdn/'s first apply.
  cdn_panels_ready = local.distribution_id != null && local.router_function_name != null
}
