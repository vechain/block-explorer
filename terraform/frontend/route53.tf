################################################################################
# Route53 DNS Records
################################################################################

# CNAME record pointing to App Runner service's default URL
# This approach avoids the complexity of App Runner custom domain association
# and validation records, making CI/CD deployments seamless
resource "aws_route53_record" "frontend" {
  count = local.env.enable_custom_domain ? 1 : 0

  zone_id = local.env.environment == "production" ? data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id : data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id
  name    = local.env.domain
  type    = "CNAME"
  ttl     = 300
  records = [aws_apprunner_service.frontend.service_url]

  depends_on = [aws_apprunner_service.frontend]
}

