output "url" {
  description = "Public URL of this PR's preview. Posted as a sticky PR comment by deploy-preview.yml."
  value       = local.url
}

output "cluster_name" {
  description = "ECS cluster the preview runs in (the shared dev cluster)."
  value       = data.terraform_remote_state.ecs.outputs.cluster_name
}

output "service_name" {
  description = "Preview ECS service name. What the deploy workflow waits on for stability."
  value       = module.service.service_name
}

output "indexer_bypass_attached" {
  description = "Whether the indexer rate-limit bypass token is injected. False only if the dev frontend stack has not been applied, in which case expect 429s from the indexer."
  value       = local.indexer_secret_arn != null
}

output "terraform_workspace" {
  description = "Current Terraform workspace (pr-<N>)."
  value       = terraform.workspace
}
