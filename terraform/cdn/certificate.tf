# CloudFront reads its certificate from us-east-1 only, so this is a second certificate for the
# same names rather than a move of acm/'s. One certificate covers every alias the distribution
# answers, because a distribution can attach exactly one.

data "aws_route53_zone" "public" {
  for_each = toset(values(local.alias_zones))
  provider = aws.dns

  name         = each.value
  private_zone = false
}

resource "aws_acm_certificate" "cdn" {
  provider = aws.us_east_1

  domain_name               = local.env.domain
  subject_alternative_names = setsubtract(toset(local.aliases), [local.env.domain])
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${local.name}-cdn" }
}

# Left in DNS permanently: ACM reuses these to auto-renew before each ~13-month expiry, and
# removing one breaks renewal silently.
resource "aws_route53_record" "validation" {
  provider = aws.dns

  for_each = {
    for option in aws_acm_certificate.cdn.domain_validation_options : option.domain_name => option
  }

  allow_overwrite = true
  zone_id         = data.aws_route53_zone.public[local.alias_zones[each.key]].zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 60
}

resource "aws_acm_certificate_validation" "cdn" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cdn.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]

  timeouts {
    create = var.validation_timeout
  }
}
