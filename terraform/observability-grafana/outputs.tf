output "amg_workspace_url" {
  description = "Grafana URL for this environment. Null on a first deploy, before observability-aws has applied."
  value       = local.amg_workspace_endpoint != null ? "https://${local.amg_workspace_endpoint}" : null
}

output "overview_dashboard_url" {
  description = "Deep link to the overview dashboard."
  value       = local.amg_workspace_endpoint != null ? "https://${local.amg_workspace_endpoint}/d/be-overview" : null
}

output "dashboards_provisioned" {
  description = "Whether the datasources and dashboard exist yet. False until both observability-aws and cdn/ have applied."
  value       = local.observability_ready && local.cdn_panels_ready
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
