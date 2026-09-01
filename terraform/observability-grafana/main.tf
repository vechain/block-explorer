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

data "terraform_remote_state" "cdn" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "cdn/terraform.tfstate"
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

# Wired but empty: no writer since the ECS sidecar went, and no rule group to surface.
resource "grafana_data_source" "amp" {
  count = local.observability_ready ? 1 : 0

  type = "prometheus"
  name = "amp-${terraform.workspace}"
  uid  = local.datasource_uid_amp
  url  = local.amp_prometheus_endpoint

  json_data_encoded = jsonencode({
    httpMethod    = "POST"
    sigV4Auth     = true
    sigV4AuthType = "default"
    sigV4Region   = var.aws_region
    manageAlerts  = false
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

resource "grafana_dashboard" "overview" {
  count = local.observability_ready && local.cdn_panels_ready ? 1 : 0

  folder = grafana_folder.ops[0].uid

  config_json = templatefile("${path.module}/dashboards/overview.json", {
    datasource_uid_cloudwatch = local.datasource_uid_cloudwatch
    env                       = terraform.workspace
    region                    = local.cloudfront_region
    distribution_id           = local.distribution_id
    router_function_name      = local.router_function_name
    waf_web_acl_name          = local.waf_web_acl_name
    waf_rule_prefix           = local.waf_rule_prefix
    waf_log_group             = local.waf_log_group
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
