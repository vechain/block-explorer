output "alb_arn" {
  description = "ALB ARN. Phase 2's CloudWatch alarms and YACE job scope to this."
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name. Phase 6 points the weighted prod record at this."
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

output "app_security_group_id" {
  description = "Security group for the ECS tasks. Consumed by frontend/, and by phase 7's ElastiCache ingress rule."
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
