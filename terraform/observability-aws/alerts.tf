# Delivery path: AMP Alertmanager (and CloudWatch alarms, see alarms.tf) -> SNS
# -> bridge Lambda -> Slack.

resource "aws_secretsmanager_secret" "slack_webhook" {
  name                    = "${local.name}-slack-webhook"
  description             = "Slack incoming-webhook URL for alert delivery. Value comes from TF_VAR_slack_webhook_url."
  recovery_window_in_days = 7
}

# The Lambda's no-op gate keys off this sentinel rather than POSTing to an empty
# URL.
resource "aws_secretsmanager_secret_version" "slack_webhook" {
  secret_id     = aws_secretsmanager_secret.slack_webhook.id
  secret_string = var.slack_webhook_url == "" ? "placeholder" : var.slack_webhook_url
}

resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
}

# This policy replaces the default account-owner policy, so an unlisted
# principal is denied silently. CloudWatch is matched by alarm-name prefix
# rather than exact ARNs, which would cycle. SourceArn and SourceAccount are
# confused-deputy hardening.
data "aws_iam_policy_document" "alerts_topic" {
  statement {
    sid    = "AllowAMPPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["aps.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_prometheus_workspace.this.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  statement {
    sid    = "AllowCloudWatchAlarmPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alarm:${local.name}-*"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = data.aws_iam_policy_document.alerts_topic.json
}

# --- SNS -> Slack bridge ---

resource "aws_cloudwatch_log_group" "sns_to_slack" {
  name              = "/aws/lambda/${local.name}-sns-to-slack"
  retention_in_days = local.env.log_retention_days
}

data "aws_iam_policy_document" "sns_to_slack_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sns_to_slack" {
  name               = "${local.name}-sns-to-slack"
  assume_role_policy = data.aws_iam_policy_document.sns_to_slack_assume.json
}

resource "aws_iam_role_policy_attachment" "sns_to_slack_basic" {
  role       = aws_iam_role.sns_to_slack.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "sns_to_slack" {
  name = "${local.name}-sns-to-slack"
  role = aws_iam_role.sns_to_slack.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "ReadSlackWebhook"
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.slack_webhook.arn
    }]
  })
}

data "archive_file" "sns_to_slack" {
  type        = "zip"
  source_file = "${path.module}/lambda/sns_to_slack.py"
  output_path = "${path.module}/.terraform/sns_to_slack.zip"
}

resource "aws_lambda_function" "sns_to_slack" {
  function_name    = "${local.name}-sns-to-slack"
  role             = aws_iam_role.sns_to_slack.arn
  filename         = data.archive_file.sns_to_slack.output_path
  source_code_hash = data.archive_file.sns_to_slack.output_base64sha256
  runtime          = "python3.12"
  handler          = "sns_to_slack.handler"
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      SLACK_WEBHOOK_SECRET_ARN = aws_secretsmanager_secret.slack_webhook.arn
      # CloudWatch payloads carry no labels, so the [env] prefix comes from here.
      ALERT_ENV = terraform.workspace
    }
  }

  depends_on = [aws_cloudwatch_log_group.sns_to_slack]
}

resource "aws_lambda_permission" "sns_to_slack_invoke" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sns_to_slack.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# Both pipelines publish to the one topic, so this subscription is the single gate
# on delivery. Rules and alarms evaluate and show their state without it.
resource "aws_sns_topic_subscription" "sns_to_slack" {
  count = local.alerts_enabled ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.sns_to_slack.arn

  lifecycle {
    # Nothing else invokes the Lambda, so this plus a placeholder discards everything.
    precondition {
      condition     = var.slack_webhook_url != ""
      error_message = "alerts_enabled is true but slack_webhook_url is empty, so every alert would be discarded silently. Set the SLACK_WEBHOOK_URL secret on this environment, or set alerts_enabled: false."
    }
  }

  # Without this the subscription can land before the permission and the first
  # delivery fails with "not authorized to invoke function".
  depends_on = [aws_lambda_permission.sns_to_slack_invoke]
}

# --- AMP rules ---

resource "aws_prometheus_rule_group_namespace" "recording" {
  workspace_id = aws_prometheus_workspace.this.id
  name         = "${local.name}-recording"
  data         = local.recording_rules_yaml
}

resource "aws_prometheus_rule_group_namespace" "alerts" {
  workspace_id = aws_prometheus_workspace.this.id
  name         = "${local.name}-alerts"
  data         = local.alert_rules_yaml
}

resource "aws_prometheus_alert_manager_definition" "this" {
  workspace_id = aws_prometheus_workspace.this.id
  definition   = local.alertmanager_definition
}
