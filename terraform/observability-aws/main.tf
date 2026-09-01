# AMP and AMG for one environment, plus the service account the
# observability-grafana stack authenticates with.

data "aws_caller_identity" "current" {}

# --- Amazon Managed Prometheus ---

resource "aws_cloudwatch_log_group" "amp" {
  name              = "/aws/prometheus/${local.name}"
  retention_in_days = local.env.log_retention_days
}

resource "aws_prometheus_workspace" "this" {
  alias = local.name

  logging_configuration {
    log_group_arn = "${aws_cloudwatch_log_group.amp.arn}:*"
  }
}

# --- Amazon Managed Grafana ---

# CUSTOMER_MANAGED needs a role we own: SERVICE_MANAGED is console-only, and
# CreateWorkspace rejects it with "a Workspace Role ARN should be provided".
resource "aws_iam_role" "grafana_workspace" {
  name = "${local.name}-grafana-workspace"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "grafana.amazonaws.com" }
      Action    = "sts:AssumeRole"
      # Confused-deputy hardening. ArnLike because the workspace ID does not exist yet.
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
        ArnLike      = { "aws:SourceArn" = "arn:aws:grafana:${var.aws_region}:${data.aws_caller_identity.current.account_id}:/workspaces/*" }
      }
    }]
  })
}

# AmazonGrafanaCloudWatchAccess does not exist despite mirroring the Prometheus
# policy's name — IAM returns NoSuchEntity. AMG's own docs build the CloudWatch
# data-source role from the generic read policy instead.
resource "aws_iam_role_policy_attachment" "grafana_cloudwatch" {
  role       = aws_iam_role.grafana_workspace.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "grafana_prometheus" {
  role       = aws_iam_role.grafana_workspace.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonPrometheusQueryAccess"
}

# No VPC connection: every datasource here (AMP, CloudWatch) is a public AWS
# endpoint, and the shared cache will publish to CloudWatch too.
resource "aws_grafana_workspace" "this" {
  name                     = local.name
  description              = "${var.project} ${terraform.workspace} observability"
  account_access_type      = "CURRENT_ACCOUNT"
  authentication_providers = ["SAML"]
  permission_type          = "CUSTOMER_MANAGED"
  role_arn                 = aws_iam_role.grafana_workspace.arn

  # AMG creates workspaces at Grafana 8/9/10/12 only: the v11 train was folded
  # into v12, so "11.0" hard-fails CreateWorkspace with a ValidationException.
  grafana_version = "12.4"
}

# AMG rejects an empty role-value list ("must be between 1 and 20").
resource "aws_grafana_workspace_saml_configuration" "okta" {
  count = local.okta_saml_ready ? 1 : 0

  workspace_id       = aws_grafana_workspace.this.id
  idp_metadata_url   = local.env.grafana_okta_saml_metadata_url
  admin_role_values  = local.env.grafana_admin_okta_groups
  editor_role_values = local.env.grafana_editor_okta_groups

  # Assertion names from Okta's "Amazon Managed Grafana" catalog app. They must
  # match it exactly or role mapping never fires and every SSO user is a Viewer.
  login_assertion = "mail"
  email_assertion = "mail"
  name_assertion  = "displayName"
  role_assertion  = "role"
}

# --- Service account for the Grafana provider ---

# AMG caps token TTLs at 30 days no matter who mints them, so the token is
# replaced ahead of expiry. The rotation date is in the name, which is what
# makes a replacement visible in the AMG console.
resource "time_rotating" "grafana_sa_token" {
  rotation_days = 25
}

resource "aws_grafana_workspace_service_account" "terraform" {
  name         = "terraform"
  grafana_role = "ADMIN"
  workspace_id = aws_grafana_workspace.this.id
}

resource "aws_grafana_workspace_service_account_token" "terraform" {
  name               = "terraform-${formatdate("YYYYMMDD", time_rotating.grafana_sa_token.rotation_rfc3339)}"
  service_account_id = aws_grafana_workspace_service_account.terraform.service_account_id
  workspace_id       = aws_grafana_workspace.this.id
  seconds_to_live    = 60 * 60 * 24 * 30

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [time_rotating.grafana_sa_token.rotation_rfc3339]
  }
}

# Crosses to observability-grafana as an ARN, not a remote-state output. Named
# with dashes, not the repo's `block-explorer/<env>/` prefix: the App Runner
# instance role can read that whole prefix, and this is a Grafana admin token.
resource "aws_secretsmanager_secret" "amg_sa_token" {
  name                    = "${local.name}-amg-sa-token"
  description             = "Grafana service-account token used by the observability-grafana Terraform provider. Rotated by time_rotating."
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "amg_sa_token" {
  secret_id     = aws_secretsmanager_secret.amg_sa_token.id
  secret_string = aws_grafana_workspace_service_account_token.terraform.key

  lifecycle {
    create_before_destroy = true
  }
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
