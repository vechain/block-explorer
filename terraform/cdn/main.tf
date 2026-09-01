# CloudFront in front of one private bucket, with no origin server behind it. The bucket holds
# every published bundle under its own app-<sha12> prefix and one runtime-config.json per
# environment; edge-router.js is what turns a request into a key under those.
#
# Until the deploy publishes a bundle and pins it, the distribution answers from a prefix that
# does not exist. That is the expected state after a first apply.

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "app" {
  bucket = "${local.name}-app-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "app" {
  bucket = aws_s3_bucket.app.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "app" {
  name                              = "${local.name}-app"
  description                       = "Signs CloudFront's reads of the bundle bucket."
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "app" {
  statement {
    sid       = "AllowThisDistributionToRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.app.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.app.arn, "${aws_s3_bucket.app.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id
  policy = data.aws_iam_policy_document.app.json
}

# Every key under a bundle prefix is immutable, and the prefix is in the cache key because the
# function rewrites the URI before the lookup. Nothing here needs to revalidate.
resource "aws_cloudfront_cache_policy" "bundle" {
  name        = "${local.name}-bundle"
  min_ttl     = 1
  default_ttl = 31536000
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# The one mutable object: a deploy rewrites it in place, so it is invalidated rather than aged out.
resource "aws_cloudfront_cache_policy" "runtime_config" {
  name        = "${local.name}-runtime-config"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 60

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${local.name}-security"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = tonumber(regex("max-age=([0-9]+)", local.hsts_header_value)[0])
      include_subdomains         = terraform.workspace == "prod"
      preload                    = terraform.workspace == "prod"
      override                   = true
    }
  }
}

resource "aws_cloudfront_distribution" "main" {
  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2and3"
  price_class     = lookup(local.env, "cdn_price_class", "PriceClass_100")
  aliases         = local.aliases
  comment         = "${local.name} static app"
  web_acl_id      = local.waf_enabled ? aws_wafv2_web_acl.cdn[0].arn : null

  origin {
    origin_id                = "app-bucket"
    domain_name              = aws_s3_bucket.app.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.app.id
  }

  default_cache_behavior {
    target_origin_id       = "app-bucket"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = aws_cloudfront_cache_policy.bundle.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }

  # Matched on the URI as the viewer sent it, before the function rewrites it to <env>/.
  ordered_cache_behavior {
    path_pattern           = "/runtime-config.json"
    target_origin_id       = "app-bucket"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = aws_cloudfront_cache_policy.runtime_config.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cdn.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# Route53 offers no path from a weighted record back to a simple one, so the identifier stays.
resource "aws_route53_record" "app" {
  for_each = toset(local.record_names)
  provider = aws.dns

  zone_id = data.aws_route53_zone.public[local.alias_zones[each.value]].zone_id
  name    = each.value
  type    = "A"

  set_identifier = "cdn-${terraform.workspace}"

  weighted_routing_policy {
    weight = 100
  }

  # CloudFront has no health to evaluate.
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# One record for every PR, as preview-edge/ held it: a preview writes no DNS at all, only its own
# key in the store, so a teardown cannot strand a name.
resource "aws_route53_record" "preview_wildcard" {
  for_each = toset(compact([local.preview_wildcard]))
  provider = aws.dns

  zone_id = data.aws_route53_zone.public[local.alias_zones[each.value]].zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }

    precondition {
      condition     = terraform.workspace != "prod" || var.dns_role_arn != ""
      error_message = "prod needs dns_role_arn: the public zones are in the dev account. Set DNS_WRITER_ROLE_ARN on the prod GitHub Environment."
    }
  }
}
