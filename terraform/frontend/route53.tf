################################################################################
# Route53 DNS Records
################################################################################

resource "aws_route53_record" "preview_frontend" {
    count = local.env.environment == "preview" ? 1 : 0
    zone_id = data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id
    name    = local.env.domain
    type    = "CNAME"
    ttl     = 30
    records = [aws_apprunner_service.frontend.service_url]
    depends_on = [aws_apprunner_service.frontend]
}

resource "aws_route53_record" "prod_frontend" {
    count = local.env.environment == "prod" ? 1 : 0
    zone_id = data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id
    name    = local.env.domain
    type    = "A"
    alias {
        name    = aws_apprunner_service.frontend.service_url
        zone_id = data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id
        evaluate_target_health = true
    }
    depends_on = [aws_apprunner_service.frontend]
}
