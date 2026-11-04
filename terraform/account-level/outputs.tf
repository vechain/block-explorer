################################################################################
# Outputs
################################################################################

output "block_explorer_public_zone_prod_id" {
  description = "ID of the block-explorer.vechain.org public zone"
  value       = aws_route53_zone.block_explorer_public_zone_prod.zone_id
}

output "block_explorer_public_zone_preview_id" {
  description = "ID of the block-explorer-preview.vechain.org public zone"
  value       = aws_route53_zone.block_explorer_public_zone_preview.zone_id
}

output "preview_certificate_arn" {
  description = "ARN of the preview wildcard SSL certificate"
  value       = aws_acm_certificate.preview_wildcard.arn
}

