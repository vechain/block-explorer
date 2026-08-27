output "redis_url_secret_arn" {
  description = "Secret holding the rediss:// URL. Injected as REDIS_URL by frontend/ and frontend-preview/; its absence is what keeps a task on per-process caches."
  value       = aws_secretsmanager_secret.redis_url.arn
}

output "preview_redis_url_secret_arn" {
  description = "The same cache under a user fenced to pr-* keys. Previews take this rather than the app secret, so unmerged code cannot read or overwrite what dev cached."
  value       = aws_secretsmanager_secret.preview_redis_url.arn
}

output "cache_name" {
  description = "Serverless cache name, which is also its CloudWatch clusterId dimension. Consumed by the ECPU and storage alarms in observability-aws/."
  value       = aws_elasticache_serverless_cache.valkey.name
}

output "cache_endpoint_address" {
  description = "Valkey endpoint host. The URL in the secret is what the app reads; this is for a bastion or a one-off redis-cli."
  value       = local.cache_endpoint.address
}

output "cache_ecpu_per_second_maximum" {
  description = "Configured ECPU ceiling. The alarm alerts on a fraction of this rather than restating the number."
  value       = local.env.cache_ecpu_per_second_max
}

output "cache_data_storage_maximum_gb" {
  description = "Configured storage ceiling in GB. Entries live their full TTL — a serverless cache exposes no eviction policy — so the working set is bounded by TTL, not by this."
  value       = local.env.cache_data_storage_max_gb
}

output "cache_security_group_id" {
  description = "Security group the cache is attached to. Ingress is one rule per client security group."
  value       = aws_security_group.cache.id
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
