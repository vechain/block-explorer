locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  name         = "${var.project}-${terraform.workspace}"

  # Pinned by hand so the committed dashboard JSON can name its datasources and
  # keep working across an environment rebuild. Changing one orphans every query
  # in every dashboard that references it.
  datasource_uid_amp              = "amp-${terraform.workspace}"
  datasource_uid_amp_alertmanager = "amp-alertmanager-${terraform.workspace}"
  datasource_uid_cloudwatch       = "cloudwatch-${terraform.workspace}"

  # Dimension values the CloudWatch panels query. Named by the same convention
  # ecs/ and frontend/ use, rather than read back through remote state.
  ecs_cluster_name      = "${local.name}-cluster"
  frontend_service_name = "${local.name}-frontend"

  amg_workspace_endpoint         = try(data.terraform_remote_state.observability_aws.outputs.amg_workspace_endpoint, null)
  amg_sa_token_secret_arn        = try(data.terraform_remote_state.observability_aws.outputs.amg_service_account_token_secret_arn, null)
  amg_sa_token_secret_version_id = try(data.terraform_remote_state.observability_aws.outputs.amg_service_account_token_secret_version_id, null)
  amp_prometheus_endpoint        = try(data.terraform_remote_state.observability_aws.outputs.amp_prometheus_endpoint, null)

  # Off, there is no rule group or Alertmanager definition to point Grafana at.
  alerts_enabled = try(data.terraform_remote_state.observability_aws.outputs.alerts_enabled, false)

  amg_service_account_token = try(data.aws_secretsmanager_secret_version.amg_sa_token[0].secret_string, null)

  alb_arn_suffix          = try(data.terraform_remote_state.edge.outputs.alb_arn_suffix, null)
  target_group_arn_suffix = try(data.terraform_remote_state.edge.outputs.target_group_arn_suffix, null)

  # Falls back to a name that matches nothing, so WAF-off renders empty panels.
  waf_web_acl_name = coalesce(try(data.terraform_remote_state.edge.outputs.waf_web_acl_name, null), "waf-disabled")

  # Rule dimension values are visibility_config metric names, not terraform rule names.
  waf_rule_prefix = "${local.name}-waf"

  # Mirrors the naming in frontend/ and edge/ rather than another remote state read.
  frontend_log_group = "/ecs/${local.frontend_service_name}"
  waf_log_group      = "aws-waf-logs-${local.name}"

  # Version ID, not the token: a boolean off a sensitive value is sensitive too.
  observability_ready = local.amg_workspace_endpoint != null && local.amg_sa_token_secret_version_id != null && local.amp_prometheus_endpoint != null

  # Separate gate: the ALB panels need two outputs edge/ only grew in this
  # phase, so the rest of the dashboard should not wait on that apply.
  alb_panels_ready = local.alb_arn_suffix != null && local.target_group_arn_suffix != null
}
