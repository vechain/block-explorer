################################################################################
# ACM Certificates
################################################################################

# Production Certificate - block-explorer-prod.vechain.org
resource "aws_acm_certificate" "prod" {
  domain_name       = "block-explorer.vechain.org"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "block-explorer-prod"
    Environment = "production"
  }
}

# Wildcard Certificate for Preview Environments - *.block-explorer-preview.vechain.org
resource "aws_acm_certificate" "preview_wildcard" {
  domain_name       = "*.block-explorer-preview.vechain.org"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "block-explorer-preview-wildcard"
    Environment = "preview"
  }
}

# DNS Validation Records (only created if create_route53_records is true)
resource "aws_route53_record" "prod_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.prod.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.block_explorer_public_zone_prod.zone_id
}

resource "aws_route53_record" "preview_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.preview_wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.block_explorer_public_zone_preview.zone_id
}

# Certificate Validation
resource "aws_acm_certificate_validation" "prod" {
  certificate_arn         = aws_acm_certificate.prod.arn
  validation_record_fqdns = [for record in aws_route53_record.prod_cert_validation : record.fqdn]
}

resource "aws_acm_certificate_validation" "preview" {
  certificate_arn         = aws_acm_certificate.preview_wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.preview_cert_validation : record.fqdn]
}
