# Regional WAFv2 ACL attached straight to the ALB — there is no CloudFront in
# front of it. WAF evaluates before the listener rules, so it covers the
# /api/metrics block and any future auth gate alike.
#
# Rollout: the rate-based IP rule blocks from day one, since its false-positive
# rate is low. The AWS managed groups start in Count and flip to their own
# actions via waf_managed_rules_blocking once they have soaked against real
# traffic. waf_enabled is the off-switch if a rule storms.

locals {
  waf_enabled = local.env.waf_enabled

  # Scraper blocklist. Empty unless an environment names ranges, so the rules
  # drop out entirely rather than sitting there matching nothing.
  waf_blocked_cidrs      = lookup(local.env, "waf_blocked_cidrs", [])
  waf_blocked_asns       = lookup(local.env, "waf_blocked_asns", [])
  waf_blocklist_blocking = lookup(local.env, "waf_blocklist_blocking", false)

  waf_managed_groups = {
    "ip-reputation"   = { name = "AWSManagedRulesAmazonIpReputationList", priority = 20 }
    "anonymous-ip"    = { name = "AWSManagedRulesAnonymousIpList", priority = 30 }
    "common"          = { name = "AWSManagedRulesCommonRuleSet", priority = 40 }
    "known-bad-input" = { name = "AWSManagedRulesKnownBadInputsRuleSet", priority = 50 }
  }
}

# IPv4 only. The ASN rule is what covers the same networks over IPv6, which is
# the half a CIDR blocklist quietly misses.
resource "aws_wafv2_ip_set" "blocklist" {
  count = local.waf_enabled && length(local.waf_blocked_cidrs) > 0 ? 1 : 0

  name               = "${local.name}-waf-blocklist"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = local.waf_blocked_cidrs
}

resource "aws_wafv2_web_acl" "main" {
  count = local.waf_enabled ? 1 : 0

  name = "${local.name}-waf-alb"
  # WAFv2 allows only word characters and + = : # @ / - , . here, so no semicolons.
  description = "Edge WAF for the public ALB. The rate-based per-IP rule always blocks. AWS managed group actions are gated by waf_managed_rules_blocking."
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Redacts credential-bearing headers from WAF telemetry. This covers sampled
  # requests as well as the logs, which `redacted_fields` on the logging config
  # would not — so a false-positive match on an authenticated request cannot
  # expose a live token via wafv2:GetSampledRequests.
  data_protection_config {
    data_protection {
      field {
        field_type = "SINGLE_HEADER"
        field_keys = ["authorization", "cookie", "x-rate-limit-bypass"]
      }
      action = "SUBSTITUTION"
    }
  }

  # Ahead of the rate limit, and in Count until soaked like the managed groups.
  dynamic "rule" {
    for_each = local.waf_enabled && length(local.waf_blocked_cidrs) > 0 ? [1] : []

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
        metric_name                = "${local.name}-waf-blocklist-cidr"
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
        metric_name                = "${local.name}-waf-blocklist-asn"
        sampled_requests_enabled   = true
      }
    }
  }

  # Requests per trailing 5-minute window per source IP. Kept generous so a
  # shared corporate or carrier NAT is not caught.
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
      metric_name                = "${local.name}-waf-rate-limit-ip"
      sampled_requests_enabled   = true
    }
  }

  # override_action count = observe the whole group; none = let each rule's own
  # action apply.
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
        metric_name                = "${local.name}-waf-${rule.key}"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    # Must equal `name` above: the alarm and panels pass that as WebACL.
    metric_name              = "${local.name}-waf-alb"
    sampled_requests_enabled = true
  }
}

resource "aws_wafv2_web_acl_association" "alb" {
  count        = local.waf_enabled ? 1 : 0
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}

# The name must start `aws-waf-logs-`; that prefix is also what authorises WAF
# to deliver without a manual resource policy. Created unconditionally, so
# flipping waf_enabled off during a rule storm detaches the ACL but keeps the
# forensics — the moment they are most needed.
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name}"
  retention_in_days = local.env.log_retention_days
}

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count        = local.waf_enabled ? 1 : 0
  resource_arn = aws_wafv2_web_acl.main[0].arn

  # WAF rejects a CloudWatch log group ARN carrying the ":*" suffix.
  log_destination_configs = [trimsuffix(aws_cloudwatch_log_group.waf.arn, ":*")]

  # default_action is allow, so without a filter every allowed request would
  # ship at ingest price and bury the events worth reading.
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
