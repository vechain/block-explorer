# Datasources and dashboards inside the AMG workspace observability-aws owns.
# Separate stack because the Grafana provider cannot initialise against a
# workspace the same apply is creating.
#
# Every grafana_* resource is count-gated on observability_ready, so the first
# deploy plans cleanly with observability-aws not yet applied; the serial apply
# loop then applies that stack and re-plans this one with real outputs.

data "terraform_remote_state" "observability_aws" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "observability-aws/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "edge" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# The secret ARN exists the moment the secret does, but the value only lands
# after the workspace, service account and token — so the gate is on the version
# ID, not the ARN. Without that a partial upstream apply kills this plan with
# "couldn't find resource".
data "aws_secretsmanager_secret_version" "amg_sa_token" {
  count     = local.amg_sa_token_secret_version_id != null ? 1 : 0
  secret_id = local.amg_sa_token_secret_arn
}

# --- Datasources ---

# manageAlerts surfaces the AMP rules under Alerting; alertmanagerUid is what
# makes the silence UI work. The rules stay Terraform-owned and read-only here.
resource "grafana_data_source" "amp" {
  count = local.observability_ready ? 1 : 0

  type = "prometheus"
  name = "amp-${terraform.workspace}"
  uid  = local.datasource_uid_amp
  url  = local.amp_prometheus_endpoint

  json_data_encoded = jsonencode({
    httpMethod      = "POST"
    sigV4Auth       = true
    sigV4AuthType   = "default"
    sigV4Region     = var.aws_region
    manageAlerts    = true
    alertmanagerUid = local.datasource_uid_amp_alertmanager
  })
}

resource "grafana_data_source" "amp_alertmanager" {
  count = local.observability_ready ? 1 : 0

  type = "alertmanager"
  name = "amp-alertmanager-${terraform.workspace}"
  uid  = local.datasource_uid_amp_alertmanager
  # AMP serves Alertmanager under the Prometheus endpoint.
  url = "${trimsuffix(local.amp_prometheus_endpoint, "/")}/alertmanager"

  json_data_encoded = jsonencode({
    implementation             = "prometheus"
    sigV4Auth                  = true
    sigV4AuthType              = "default"
    sigV4Region                = var.aws_region
    handleGrafanaManagedAlerts = false
  })
}

# AWS resource metrics stay in CloudWatch; AMP carries only the sidecar's.
resource "grafana_data_source" "cloudwatch" {
  count = local.observability_ready ? 1 : 0

  type = "cloudwatch"
  name = "cloudwatch-${terraform.workspace}"
  uid  = local.datasource_uid_cloudwatch

  json_data_encoded = jsonencode({
    authType      = "default"
    defaultRegion = var.aws_region
  })
}

# --- Dashboards ---

resource "grafana_folder" "ops" {
  count = local.observability_ready ? 1 : 0

  title = "Block explorer"
  uid   = "block-explorer-${terraform.workspace}"
}

# The alert rules reference this dashboard's panel IDs in their dashboard_url
# annotations, so renumbering a panel breaks the deep link from Slack.
resource "grafana_dashboard" "overview" {
  count = local.observability_ready && local.alb_panels_ready ? 1 : 0

  folder = grafana_folder.ops[0].uid

  config_json = templatefile("${path.module}/dashboards/overview.json", {
    datasource_uid_amp        = local.datasource_uid_amp
    datasource_uid_cloudwatch = local.datasource_uid_cloudwatch
    env                       = terraform.workspace
    region                    = var.aws_region
    cluster_name              = local.ecs_cluster_name
    frontend_service_name     = local.frontend_service_name
    alb_suffix                = local.alb_arn_suffix
    tg_suffix                 = local.target_group_arn_suffix
    waf_web_acl_name          = local.waf_web_acl_name
  })
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
