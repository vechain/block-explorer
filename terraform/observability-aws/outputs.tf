output "amp_workspace_id" {
  description = "AMP workspace ID. What the SigV4 Grafana datasource is built from."
  value       = aws_prometheus_workspace.this.id
}

output "amp_workspace_arn" {
  description = "AMP workspace ARN. The Resource on the sidecar's aps:RemoteWrite statement."
  value       = aws_prometheus_workspace.this.arn
}

output "amp_prometheus_endpoint" {
  description = "AMP query and remote-write endpoint, trailing slash included."
  value       = aws_prometheus_workspace.this.prometheus_endpoint
}

output "amg_workspace_id" {
  description = "AMG workspace ID."
  value       = aws_grafana_workspace.this.id
}

output "amg_workspace_endpoint" {
  description = "AMG workspace endpoint, host only."
  value       = aws_grafana_workspace.this.endpoint
}

output "amg_workspace_url" {
  description = "Full Grafana URL for this environment."
  value       = "https://${aws_grafana_workspace.this.endpoint}"
}

output "amg_service_account_token_secret_arn" {
  description = "Secret holding the Grafana service-account token. observability-grafana resolves the value through a Secrets Manager data source rather than taking cleartext across remote state."
  value       = aws_secretsmanager_secret.amg_sa_token.arn
}

output "amg_service_account_token_secret_version_id" {
  description = "Version ID of that secret, non-null only once a value has been written. observability-grafana gates its data source on this: the ARN exists as soon as the secret does, so without a version-aware gate a partial apply crashes the downstream plan."
  value       = aws_secretsmanager_secret_version.amg_sa_token.version_id
}

output "alerts_sns_topic_arn" {
  description = "Topic both AMP Alertmanager and the CloudWatch alarms publish to."
  value       = aws_sns_topic.alerts.arn
}

output "alerts_enabled" {
  description = "Whether the bridge Lambda is subscribed to the topic. False in dev: rules and alarms evaluate, nothing is delivered."
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
