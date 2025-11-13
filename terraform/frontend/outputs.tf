################################################################################
# Outputs
################################################################################

output "service_id" {
  description = "ID of the App Runner service"
  value       = aws_apprunner_service.frontend.service_id
}

output "service_arn" {
  description = "ARN of the App Runner service"
  value       = aws_apprunner_service.frontend.arn
}

output "service_url" {
  description = "Default App Runner service URL"
  value       = "https://${aws_apprunner_service.frontend.service_url}"
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = local.env.enable_custom_domain ? "https://${local.env.domain}" : "https://${aws_apprunner_service.frontend.service_url}"
}

output "environment" {
  description = "Environment name"
  value       = local.env.environment
}

output "status" {
  description = "Current status of the App Runner service"
  value       = aws_apprunner_service.frontend.status
}

