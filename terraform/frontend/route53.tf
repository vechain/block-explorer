################################################################################
# Route53 DNS Records
################################################################################

resource "aws_route53_record" "frontend" {
    count = local.env.enable_custom_domain ? 1 : 0
    zone_id = local.env.environment == "production" ? data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id : data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id
    name    = local.env.domain
    type    = "A"
    records = [aws_apprunner_service.frontend.service_url]
    ttl     = 30
    depends_on = [aws_apprunner_service.frontend]
}
