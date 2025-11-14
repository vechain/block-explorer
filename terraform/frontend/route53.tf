################################################################################
# Route53 DNS Records
################################################################################

data "aws_apprunner_hosted_zone_id" "main" {}

resource "aws_route53_record" "prod_frontend" {
    count = local.env.enable_custom_domain ? 1 : 0
    zone_id = local.env.environment == "prod" ? data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id : data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id
    name    = local.env.domain
    type    = "A"
    alias {
        name    = aws_apprunner_service.frontend.service_url
        zone_id = data.aws_apprunner_hosted_zone_id.main.id
        evaluate_target_health = true
    }
    depends_on = [aws_apprunner_service.frontend]
}

resource "aws_route53_record" "validation_records" {
  count    = length([local.env.domain]) + 1
  name     = tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].name
  type     = tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].type
  records  = [tolist(aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records)[count.index].value]
  ttl      = 300
  zone_id  = local.env.environment == "prod" ? data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id : data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id
}
