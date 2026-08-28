# Certificate for the workspace's public domain, taken from the env YAML:
# dev.block-explorer.vechain.org in dev, the apex in prod.
#
# The existing account-level cert covers the apex exactly, with no wildcard, so
# the dev subdomain needs its own. Records go through aws.dns, see providers.tf.

data "aws_route53_zone" "public" {
  provider = aws.dns

  name         = var.public_zone_name
  private_zone = false
}

resource "aws_acm_certificate" "main" {
  domain_name       = local.env.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = local.env.domain }
}

# Leave this record in DNS permanently — ACM reuses it to auto-renew before
# each ~13-month expiry, and removing it breaks renewal silently.
resource "aws_route53_record" "validation" {
  provider = aws.dns

  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.public.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]

  timeouts {
    create = var.validation_timeout
  }
}

# explore.vechain.org, which is its own zone apex — so the domain doubles as the
# zone name. The only cert covering it today is a blue/green leftover, expired.
data "aws_route53_zone" "extra" {
  for_each = local.extra_domains
  provider = aws.dns

  name         = each.value
  private_zone = false
}

resource "aws_acm_certificate" "extra" {
  for_each = local.extra_domains

  domain_name       = each.value
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = each.value }
}

# Permanent, for the same renewal reason as the record above.
resource "aws_route53_record" "extra_validation" {
  provider = aws.dns

  for_each = {
    for dvo in flatten([for c in aws_acm_certificate.extra : tolist(c.domain_validation_options)]) :
    dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.extra[each.key].zone_id
}

resource "aws_acm_certificate_validation" "extra" {
  for_each = local.extra_domains

  certificate_arn         = aws_acm_certificate.extra[each.key].arn
  validation_record_fqdns = [aws_route53_record.extra_validation[each.key].fqdn]

  timeouts {
    create = var.validation_timeout
  }
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }

    # Without it the zone lookup runs against the prod account and fails with a
    # no-matching-zone error that says nothing about the missing role.
    precondition {
      condition     = terraform.workspace != "prod" || var.dns_role_arn != ""
      error_message = "prod needs dns_role_arn: the public zone is in the dev account. Set DNS_WRITER_ROLE_ARN on the prod GitHub Environment."
    }
  }
}
