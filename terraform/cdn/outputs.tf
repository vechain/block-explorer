output "bucket_name" {
  description = "Bucket the deploy publishes bundles and each environment's runtime-config.json into."
  value       = aws_s3_bucket.app.id
}

output "distribution_id" {
  description = "Distribution the deploy invalidates after an activate."
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_domain_name" {
  description = "CloudFront's own name. Reaching the environment through this rather than its public name is how it is verified before DNS moves."
  value       = aws_cloudfront_distribution.main.domain_name
}

output "key_value_store_arn" {
  description = "Store mapping a host to its bundle and runtime-config prefix. The preview workflow writes its own PR's key here."
  value       = aws_cloudfront_key_value_store.routes.arn
}

output "host_keys" {
  description = "Store keys this environment owns — its public names plus the distribution's own. The deploy's activate step moves all of them to the bundle it published."
  value       = keys(aws_cloudfrontkeyvaluestore_key.host)
}

output "runtime_config_base" {
  description = "Everything the environment's runtime-config.json carries except the version, from `runtime_config` in the env YAML. The deploy merges the version it activated into this and writes the result to <env>/runtime-config.json."
  value       = lookup(local.env, "runtime_config", {})
}

output "verify_url" {
  description = "URL the deploy checks itself against. CloudFront's own name, so it answers before — and independently of — the public record."
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "serving" {
  description = "Whether this environment's DNS points here rather than at the ALB. Follows `hosting` in the environment YAML."
  value       = local.serving
}

output "waf_web_acl_name" {
  description = "WAF ACL name, which is also its CloudWatch WebACL dimension. Null when waf_enabled is off."
  value       = local.waf_enabled ? aws_wafv2_web_acl.cdn[0].name : null
}

output "url" {
  description = "Public URL the environment serves on."
  value       = "https://${local.env.domain}"
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
