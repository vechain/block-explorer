# Certificate for the workspace's public domain, taken from the env YAML:
# dev.block-explorer.vechain.org in dev.
#
# The existing account-level cert covers the apex exactly, with no wildcard, so
# the dev subdomain needs its own. The zone lives in this account, so unlike
# agent-marketplace we can write the validation record ourselves.
#
# Phase 5 note: the zone stays in explorer-dev, so a prod-account apply of this
# stack needs a cross-account provider for the record. ACM does not care which
# account hosts the zone.

data "aws_route53_zone" "public" {
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

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
