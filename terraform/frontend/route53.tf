################################################################################
# Route53 DNS Records for Custom Domain Validation
################################################################################

# Local to extract validation records from App Runner custom domain association
# We convert the list to a map with indices to avoid for_each with unknown values
locals {
  validation_records_list = local.env.enable_custom_domain ? try(
    aws_apprunner_custom_domain_association.frontend[0].certificate_validation_records,
    []
  ) : []
}

# Create validation records using count instead of for_each
# App Runner typically provides 1-3 validation records
resource "aws_route53_record" "validation" {
  count = local.env.enable_custom_domain ? length(local.validation_records_list) : 0

  zone_id = local.env.environment == "production" ? data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_prod_id : data.terraform_remote_state.account_level.outputs.block_explorer_public_zone_preview_id

  name    = local.validation_records_list[count.index].name
  type    = local.validation_records_list[count.index].type
  records = [local.validation_records_list[count.index].value]
  ttl     = 300

  allow_overwrite = true

  lifecycle {
    create_before_destroy = true
  }
}
