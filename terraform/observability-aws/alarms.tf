# The whole alerting surface: nothing publishes to AMP any more. CloudFront and its
# CLOUDFRONT-scope WAF publish only to us-east-1, so those alarms use the topic there.
#
# Descriptions must read "Title — summary." The bridge Lambda splits on the em dash.

data "terraform_remote_state" "cdn" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "cdn/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

locals {
  distribution_id      = try(data.terraform_remote_state.cdn.outputs.distribution_id, null)
  router_function_name = try(data.terraform_remote_state.cdn.outputs.router_function_name, null)
  waf_web_acl_name     = try(data.terraform_remote_state.cdn.outputs.waf_web_acl_name, null)

  # Every CloudFront series carries Region = Global. The CLOUDFRONT-scope WAF series carry no
  # Region dimension at all — it is required for every protected resource type except CloudFront.
  cloudfront_dimensions = local.distribution_id == null ? {} : {
    DistributionId = local.distribution_id
    Region         = "Global"
  }

  router_dimensions = local.router_function_name == null ? {} : {
    FunctionName   = local.router_function_name
    DistributionId = local.distribution_id
    Region         = "Global"
  }

  cdn_alarms_enabled = local.alerts_enabled && local.distribution_id != null

  # Provisional. CloudFront's additional metrics only start collecting on this release, and the
  # 4xx baseline is not zero by construction: every bot probe for an extensioned path is a 403.
  # Read a day of prod before trusting either, and tune here rather than in the resource.
  cdn_thresholds  = lookup(local.env, "cdn_alarm_thresholds", {})
  threshold_4xx   = lookup(local.cdn_thresholds, "error_rate_4xx", 50)
  threshold_cache = lookup(local.cdn_thresholds, "cache_hit_rate", 80)

  alerts_topic_arns      = [aws_sns_topic.alerts.arn]
  edge_alerts_topic_arns = [aws_sns_topic.alerts_us_east_1.arn]

  # An SNS topic policy only applies to statements naming that topic, so the two get one
  # rendering each rather than sharing a document.
  alert_topic_arns = {
    regional = aws_sns_topic.alerts.arn
    edge     = aws_sns_topic.alerts_us_east_1.arn
  }
}

# try() on the remote state above turns a renamed output or a moved state key into a clean apply
# with no CDN coverage at all, which is the failure mode this whole PR set out to remove.
resource "terraform_data" "cdn_state_guard" {
  lifecycle {
    precondition {
      condition     = !local.alerts_enabled || local.distribution_id != null
      error_message = "alerts_enabled is true but cdn/ exposes no distribution_id, so every CloudFront alarm would be skipped silently. Apply cdn/ first, or check its outputs."
    }
  }
}

# The one alarm about the alerting path itself. Delivery is circular — it
# publishes to the topic whose consumer is broken — so read this in CloudWatch or
# Grafana rather than expecting it in Slack.
resource "aws_cloudwatch_metric_alarm" "alert_delivery_failing" {
  count = local.alerts_enabled ? 1 : 0

  alarm_name        = "${local.name}-alert-delivery-failing"
  alarm_description = "Alert delivery is failing — The SNS to Slack bridge is erroring, so rules and alarms are firing into nothing."

  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.sns_to_slack.function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}

# A rate, not a count: CloudFront publishes 5xxErrorRate as a percentage of viewer requests, so
# this reads the same at 20 req/s and at 900. The origin is a bucket, so a sustained 5xx is
# CloudFront failing to read it rather than an application fault.
resource "aws_cloudwatch_metric_alarm" "cdn_5xx" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-5xx"
  alarm_description = "CDN returning 5xx — More than 1% of viewer requests have failed for five minutes. With a bucket origin this is CloudFront or the bundle prefix, not the app."

  namespace           = "AWS/CloudFront"
  metric_name         = "5xxErrorRate"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 5
  comparison_operator = "GreaterThanThreshold"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# What the old no-healthy-targets alarm caught: the site answering nothing at all. Every rate
# metric below goes silent in that case rather than spiking, because a rate needs a denominator.
# `breaching` on missing data is the whole point — prod's floor is four orders of magnitude up.
resource "aws_cloudwatch_metric_alarm" "cdn_no_requests" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-no-requests"
  alarm_description = "CDN is serving nothing — Fewer than 60 requests a minute for ten minutes, or no data at all. Every other alarm here is a rate and goes quiet through the same failure."

  namespace           = "AWS/CloudFront"
  metric_name         = "Requests"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "LessThanThreshold"
  threshold           = 60
  treat_missing_data  = "breaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# A missing bundle prefix reads as 403 and a caught routing-store failure as 404, and neither
# moves the 5xx rate or request volume. See README.md.
resource "aws_cloudwatch_metric_alarm" "cdn_4xx" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-4xx"
  alarm_description = "CDN is answering 4xx for most traffic — Over ${local.threshold_4xx}% of viewer requests for ten minutes. A missing bundle prefix reads as 403 and a routing-store failure reads as 404, and neither moves the 5xx rate."

  namespace           = "AWS/CloudFront"
  metric_name         = "4xxErrorRate"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "GreaterThanThreshold"
  threshold           = local.threshold_4xx
  treat_missing_data  = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# Bundle keys are immutable, so a sustained miss means requests are landing on the wrong prefix.
# `missing` rather than `notBreaching`: this metric needs the monitoring subscription, and losing
# it should page as INSUFFICIENT_DATA rather than sit green over a series nobody publishes.
resource "aws_cloudwatch_metric_alarm" "cdn_cache_hit_rate_low" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-cache-hit-rate-low"
  alarm_description = "CDN cache hit rate is low — Under ${local.threshold_cache}% for thirty minutes, or the additional-metrics subscription has gone. Bundle keys are immutable, so a sustained miss rate means requests are not landing on the prefix they should."

  namespace           = "AWS/CloudFront"
  metric_name         = "CacheHitRate"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 6
  datapoints_to_alarm = 6
  comparison_operator = "LessThanThreshold"
  threshold           = local.threshold_cache
  treat_missing_data  = "missing"

  alarm_actions             = local.edge_alerts_topic_arns
  ok_actions                = local.edge_alerts_topic_arns
  insufficient_data_actions = local.edge_alerts_topic_arns
}

# Both error kinds, because a malformed response object counts as validation rather than
# execution and is the likelier of the two after an edge-router.js edit. DistributionId is in the
# dimension set because function metrics are published per function per distribution.
resource "aws_cloudwatch_metric_alarm" "router_errors" {
  count    = local.cdn_alarms_enabled && local.router_function_name != null ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-router-errors"
  alarm_description = "Edge router is erroring — The viewer-request function has failed or returned an invalid response on real traffic for five minutes, and CloudFront answered those requests with a 502."

  metric_query {
    id          = "failures"
    expression  = "execution + validation"
    label       = "Router failures"
    return_data = true
  }

  metric_query {
    id = "execution"

    metric {
      namespace   = "AWS/CloudFront"
      metric_name = "FunctionExecutionErrors"
      dimensions  = local.router_dimensions
      period      = 60
      stat        = "Sum"
    }
  }

  metric_query {
    id = "validation"

    metric {
      namespace   = "AWS/CloudFront"
      metric_name = "FunctionValidationErrors"
      dimensions  = local.router_dimensions
      period      = 60
      stat        = "Sum"
    }
  }

  evaluation_periods  = 5
  datapoints_to_alarm = 5
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# Reads either way round: a real flood, or a managed rule group false-positiving
# on legitimate traffic once it is flipped from Count to Block.
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  count    = local.alerts_enabled && local.waf_web_acl_name != null ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-waf-blocking-heavily"
  alarm_description = "WAF is blocking heavily — More than 5 requests per second have been blocked for over 10 minutes. Check the WAF log group for whether the source is hostile or a false positive."

  namespace   = "AWS/WAFV2"
  metric_name = "BlockedRequests"

  # Rule = ALL is the across-rules total WAF publishes next to the per-rule series.
  dimensions = {
    WebACL = local.waf_web_acl_name
    Rule   = "ALL"
  }

  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "GreaterThanThreshold"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}
