# The same ACL edge/ attaches to the ALB, at CLOUDFRONT scope. A Web ACL cannot span scopes, so
# this is a second copy rather than a move, and the two coexist until the ALB goes. Blocklist
# entries are managed outside Terraform and have to be added to both — see README.md.

locals {
  waf_enabled = local.env.waf_enabled

  waf_blocked_asns       = lookup(local.env, "waf_blocked_asns", [])
  waf_blocklist_blocking = lookup(local.env, "waf_blocklist_blocking", false)

  waf_managed_groups = {
    "ip-reputation"   = { name = "AWSManagedRulesAmazonIpReputationList", priority = 20 }
    "anonymous-ip"    = { name = "AWSManagedRulesAnonymousIpList", priority = 30 }
    "common"          = { name = "AWSManagedRulesCommonRuleSet", priority = 40 }
    "known-bad-input" = { name = "AWSManagedRulesKnownBadInputsRuleSet", priority = 50 }
  }
}

# IPv4 only. The ASN rule is what covers the same networks over IPv6, which is the half a CIDR
# blocklist quietly misses.
resource "aws_wafv2_ip_set" "blocklist" {
  count    = local.waf_enabled ? 1 : 0
  provider = aws.us_east_1

  name               = "${local.name}-waf-cdn-blocklist"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = []

  lifecycle {
    ignore_changes = [addresses]
  }
}

resource "aws_wafv2_web_acl" "cdn" {
  count    = local.waf_enabled ? 1 : 0
  provider = aws.us_east_1

  name = "${local.name}-waf-cdn"
  # WAFv2 allows only word characters and + = : # @ / - , . here, so no semicolons.
  description = "Edge WAF for the CloudFront distribution. The rate-based per-IP rule always blocks. AWS managed group actions are gated by waf_managed_rules_blocking."
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Covers sampled requests as well as the logs, so a false-positive match on an authenticated
  # request cannot expose a live token through wafv2:GetSampledRequests.
  data_protection_config {
    data_protection {
      field {
        field_type = "SINGLE_HEADER"
        field_keys = ["authorization", "cookie", "x-rate-limit-bypass"]
      }
      action = "SUBSTITUTION"
    }
  }

  dynamic "rule" {
    for_each = local.waf_enabled ? [1] : []

    content {
      name     = "blocklist-cidr"
      priority = 5

      action {
        dynamic "block" {
          for_each = local.waf_blocklist_blocking ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = local.waf_blocklist_blocking ? [] : [1]
          content {}
        }
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocklist[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name}-waf-cdn-blocklist-cidr"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = local.waf_enabled && length(local.waf_blocked_asns) > 0 ? [1] : []

    content {
      name     = "blocklist-asn"
      priority = 6

      action {
        dynamic "block" {
          for_each = local.waf_blocklist_blocking ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = local.waf_blocklist_blocking ? [] : [1]
          content {}
        }
      }

      statement {
        asn_match_statement {
          asn_list = local.waf_blocked_asns
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name}-waf-cdn-blocklist-asn"
        sampled_requests_enabled   = true
      }
    }
  }

  # Requests per trailing 5-minute window per source IP. Kept generous so a shared corporate or
  # carrier NAT is not caught.
  rule {
    name     = "rate-limit-ip"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = local.env.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-waf-cdn-rate-limit-ip"
      sampled_requests_enabled   = true
    }
  }

  # override_action count = observe the whole group; none = let each rule's own action apply.
  dynamic "rule" {
    for_each = local.waf_managed_groups

    content {
      name     = "aws-${rule.key}"
      priority = rule.value.priority

      override_action {
        dynamic "none" {
          for_each = local.env.waf_managed_rules_blocking ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = local.env.waf_managed_rules_blocking ? [] : [1]
          content {}
        }
      }

      statement {
        managed_rule_group_statement {
          vendor_name = "AWS"
          name        = rule.value.name
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name}-waf-cdn-${rule.key}"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    # Must equal `name` above: the alarm and panels pass that as WebACL.
    metric_name              = "${local.name}-waf-cdn"
    sampled_requests_enabled = true
  }
}

# The name must start `aws-waf-logs-`; that prefix is also what authorises WAF to deliver without
# a manual resource policy. CLOUDFRONT-scope logs are delivered in us-east-1.
resource "aws_cloudwatch_log_group" "waf" {
  provider = aws.us_east_1

  name              = "aws-waf-logs-${local.name}-cdn"
  retention_in_days = local.env.log_retention_days
}

resource "aws_wafv2_web_acl_logging_configuration" "cdn" {
  count    = local.waf_enabled ? 1 : 0
  provider = aws.us_east_1

  resource_arn = aws_wafv2_web_acl.cdn[0].arn

  # WAF rejects a CloudWatch log group ARN carrying the ":*" suffix.
  log_destination_configs = [trimsuffix(aws_cloudwatch_log_group.waf.arn, ":*")]

  # default_action is allow, so without a filter every allowed request would ship at ingest price
  # and bury the events worth reading.
  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }
    }
  }
}
