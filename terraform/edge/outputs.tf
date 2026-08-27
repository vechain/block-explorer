output "alb_arn" {
  description = "ALB ARN. CloudWatch alarms and dashboard queries want alb_arn_suffix instead."
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix. The form CloudWatch takes as its LoadBalancer dimension, so alarms and dashboard queries use this rather than the ARN."
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "ALB DNS name. Phase 7 points the weighted prod record at this."
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB canonical hosted zone ID. Needed alongside alb_dns_name to write an alias record from another account."
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group the ECS service registers into. Consumed by frontend/."
  value       = aws_lb_target_group.app.arn
}

output "target_group_arn_suffix" {
  description = "Target group ARN suffix, for the CloudWatch TargetGroup dimension."
  value       = aws_lb_target_group.app.arn_suffix
}

output "waf_web_acl_name" {
  description = "WAF ACL name, which is also its CloudWatch WebACL dimension. Null when waf_enabled is off, which drops the WAF panels rather than querying a dimension that publishes nothing."
  value       = local.waf_enabled ? aws_wafv2_web_acl.main[0].name : null
}

output "app_security_group_id" {
  description = "Security group for the ECS tasks. Consumed by frontend/, and by phase 4's ElastiCache ingress rule."
  value       = aws_security_group.app.id
}

output "https_listener_arn" {
  description = "HTTPS listener ARN. Later phases add rules to it."
  value       = aws_lb_listener.https.arn
}

output "url" {
  description = "Public URL the environment serves on."
  value       = "https://${local.env.domain}"
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
