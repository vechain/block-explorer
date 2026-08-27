output "service_name" {
  description = "ECS service name. The deploy workflow targets this with `aws ecs update-service`."
  value       = module.service.service_name
}

output "cluster_name" {
  description = "ECS cluster the service runs in."
  value       = data.terraform_remote_state.ecs.outputs.cluster_name
}

output "task_definition_family" {
  description = "Task definition family. Pass it to `--task-definition` on a forced deployment, or the service redeploys the revision it is pinned to."
  value       = module.service.task_definition_family
}

output "log_group_name" {
  description = "CloudWatch log group for the service."
  value       = module.service.log_group_name
}

output "indexer_rate_limit_bypass_secret_arn" {
  description = "Secret holding the x-rate-limit-bypass token. Seeded blank; set a real value by hand, then redeploy so a task picks it up."
  value       = aws_secretsmanager_secret.indexer_rate_limit_bypass.arn
}

output "sidecar_attached" {
  description = "Whether the ADOT sidecar is in the task definition. False until phase 2's AMP workspace exists."
  value       = local.sidecar_ready
}

output "cache_attached" {
  description = "Whether the tasks use the shared Valkey. False leaves every proxy cache per-task and cold on each deploy, which is a hit-rate story rather than an outage."
  value       = local.cache_ready
}

output "url" {
  description = "Public URL the environment serves on."
  value       = "https://${local.env.domain}"
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
