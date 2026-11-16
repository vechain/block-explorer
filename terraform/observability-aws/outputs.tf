output "alerts_sns_topic_arn" {
  description = "Topic the regional CloudWatch alarms publish to. The CloudFront and WAF alarms use the us-east-1 topic beside it, since an alarm can only act in its own region."
  value       = aws_sns_topic.alerts.arn
}

output "alerts_enabled" {
  description = "Whether alerting is on at all. False in dev: no CloudWatch alarms and no subscription. The topics, the bridge and the secret are built either way."
  value       = local.alerts_enabled
}

output "slack_webhook_secret_arn" {
  description = "Secret the bridge Lambda reads at runtime. Seeded with a `placeholder` sentinel unless TF_VAR_slack_webhook_url is set, which makes the Lambda no-op."
  value       = aws_secretsmanager_secret.slack_webhook.arn
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
