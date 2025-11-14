################################################################################
# Outputs
################################################################################

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.block_explorer.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.block_explorer.arn
}

output "block_explorer_public_zone_prod_id" {
  description = "ID of the block-explorer.vechain.org public zone"
  value       = aws_route53_zone.block_explorer_public_zone_prod.zone_id
}

output "block_explorer_public_zone_preview_id" {
  description = "ID of the block-explorer-preview.vechain.org public zone"
  value       = aws_route53_zone.block_explorer_public_zone_preview.zone_id
}

output "app_runner_instance_role_arn" {
  description = "ARN of the App Runner instance role"
  value       = aws_iam_role.app_runner_instance_role.arn
}

output "app_runner_access_role_arn" {
  description = "ARN of the App Runner access role for ECR"
  value       = aws_iam_role.app_runner_access_role.arn
}

output "prod_certificate_arn" {
  description = "ARN of the production SSL certificate"
  value       = aws_acm_certificate.prod.arn
}

output "preview_certificate_arn" {
  description = "ARN of the preview wildcard SSL certificate"
  value       = aws_acm_certificate.preview_wildcard.arn
}

