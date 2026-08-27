output "service_name" {
  description = "ECS service name. Null until observability-aws has applied and the AMP workspace exists."
  value       = local.collector_ready ? aws_ecs_service.collector[0].name : null
}

output "log_group_name" {
  description = "Collector log group. Tail this when a YACE job or a remote-write is not landing."
  value       = local.collector_ready ? aws_cloudwatch_log_group.collector[0].name : null
}

output "collector_running" {
  description = "Whether the collector is deployed. False on a first apply, before the AMP workspace it writes to exists."
  value       = local.collector_ready
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
