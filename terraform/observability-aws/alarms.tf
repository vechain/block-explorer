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

  cdn_alarms_enabled = local.alerts_enabled && local.distribution_id != null

  alerts_topic_arns      = [aws_sns_topic.alerts.arn]
  edge_alerts_topic_arns = [aws_sns_topic.alerts_us_east_1.arn]

  # An SNS topic policy only applies to statements naming that topic, so the two get one
  # rendering each rather than sharing a document.
  alert_topic_arns = {
    regional = aws_sns_topic.alerts.arn
    edge     = aws_sns_topic.alerts_us_east_1.arn
  }
}

# The one alarm about the alerting path itself. Delivery is circular — it
# publishes to the topic whose consumer is broken — so read this in CloudWatch or
# Grafana rather than expecting it in Slack.
resource "aws_cloudwatch_metric_alarm" "alert_delivery_failing" {
  count = local.alerts_enabled ? 1 : 0

  alarm_name        = "${local.name}-alert-delivery-failing"
  alarm_description = "Alert delivery is failing — the SNS to Slack bridge is erroring, so rules and alarms are firing into nothing."

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
  alarm_description = "CDN returning 5xx — more than 1% of viewer requests have failed for five minutes. With a bucket origin this is CloudFront or the bundle prefix, not the app."

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
  alarm_description = "CDN is serving nothing — fewer than 60 requests a minute for ten minutes, or no data at all. Every other alarm here is a rate and goes quiet through the same failure."

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

# The failure this replaces the old no-healthy-targets alarm with. A bundle prefix that does not
# exist, or a routing key pointing at one, turns every document into a 403 from S3 — the site is
# down and the 5xx rate stays flat, because CloudFront answers 403 rather than 502.
resource "aws_cloudwatch_metric_alarm" "cdn_403" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-403"
  alarm_description = "CDN returning 403 — more than 10% of viewer requests for ten minutes. A missing bundle prefix reads as 403 from the bucket, so this is what a bad activate looks like."

  namespace           = "AWS/CloudFront"
  metric_name         = "403ErrorRate"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "GreaterThanThreshold"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# Every bundle key is immutable and in the cache key, so a healthy distribution sits well above
# this. A sustained drop means the routing store is moving hosts between prefixes, or an
# invalidation loop is running.
resource "aws_cloudwatch_metric_alarm" "cdn_cache_hit_rate_low" {
  count    = local.cdn_alarms_enabled ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-cdn-cache-hit-rate-low"
  alarm_description = "CDN cache hit rate is low — under 80% for thirty minutes. Bundle keys are immutable, so a sustained miss rate means requests are not landing on the prefix they should."

  namespace           = "AWS/CloudFront"
  metric_name         = "CacheHitRate"
  dimensions          = local.cloudfront_dimensions
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 6
  datapoints_to_alarm = 6
  comparison_operator = "LessThanThreshold"
  threshold           = 80
  # A deploy invalidates, so the first buckets after one are expected to dip.
  treat_missing_data = "notBreaching"

  alarm_actions = local.edge_alerts_topic_arns
  ok_actions    = local.edge_alerts_topic_arns
}

# The router runs on every viewer request and is the only code left on the serving path. An
# execution error is a request that never reached the bucket.
resource "aws_cloudwatch_metric_alarm" "router_errors" {
  count    = local.cdn_alarms_enabled && local.router_function_name != null ? 1 : 0
  provider = aws.us_east_1

  alarm_name        = "${local.name}-router-errors"
  alarm_description = "Edge router is erroring — the viewer-request function has failed on real traffic for five minutes, so those requests never resolved to a bundle key."

  namespace   = "AWS/CloudFront"
  metric_name = "FunctionExecutionErrors"
  dimensions = {
    FunctionName = local.router_function_name
    Region       = "Global"
  }
  statistic           = "Sum"
  period              = 60
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
  alarm_description = "WAF is blocking heavily — more than 5 requests per second have been blocked for over 10 minutes. Check the WAF log group for whether the source is hostile or a false positive."

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
