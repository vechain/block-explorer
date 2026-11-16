# Alerting for one environment: CloudWatch alarms, SNS and the Slack bridge.
# The alarms are in alarms.tf, the delivery path in alerts.tf.

data "aws_caller_identity" "current" {}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
