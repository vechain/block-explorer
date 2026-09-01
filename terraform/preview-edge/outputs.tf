output "alb_arn" {
  description = "Preview ALB ARN."
  value       = aws_lb.preview.arn
}

output "alb_dns_name" {
  description = "Preview ALB DNS name. Nothing points at it since the previews moved to the CDN."
  value       = aws_lb.preview.dns_name
}

output "https_listener_arn" {
  description = "HTTPS listener frontend-preview/ hangs each PR's host-header rule off."
  value       = aws_lb_listener.https.arn
}

output "app_security_group_id" {
  description = "Security group preview ECS tasks attach to."
  value       = aws_security_group.app.id
}

output "domain_suffix" {
  description = "Apex previews are served under. A PR's host is pr-<N>.<suffix>."
  value       = local.env.domain_suffix
}

output "terraform_workspace" {
  description = "Current Terraform workspace, always dev. Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
