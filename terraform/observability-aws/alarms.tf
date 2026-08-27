# Everything AWS publishes about itself is alarmed here, natively. AMP carries
# only what the app sidecar collects, so an outage that stops the tasks
# reporting is reported from out here instead.
#
# Descriptions must read "Title — summary." The bridge Lambda splits on the em
# dash to render the Slack message the same shape as an Alertmanager one.

data "terraform_remote_state" "edge" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = var.state_bucket
    key     = "edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

locals {
  # By convention, not from frontend/'s state: that stack reads this one, so a read back would cycle.
  ecs_cluster_name = "${local.name}-cluster"

  monitored_services = {
    frontend = "Explorer"
  }

  alb_arn_suffix          = try(data.terraform_remote_state.edge.outputs.alb_arn_suffix, null)
  target_group_arn_suffix = try(data.terraform_remote_state.edge.outputs.target_group_arn_suffix, null)
  waf_web_acl_name        = try(data.terraform_remote_state.edge.outputs.waf_web_acl_name, null)

  alerts_topic_arns = [aws_sns_topic.alerts.arn]
}

# Running against desired, so autoscaling never has to be restated here.
# `breaching` is load-bearing: a service reporting nothing is what this catches.
resource "aws_cloudwatch_metric_alarm" "ecs_tasks_below_desired" {
  for_each = local.monitored_services

  alarm_name        = "${local.name}-${each.key}-tasks-below-desired"
  alarm_description = "${each.value} tasks below desired — ECS is running fewer tasks than the service asks for, or has stopped reporting task counts altogether."

  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  treat_missing_data  = "breaching"

  metric_query {
    id          = "drift"
    expression  = "desired - running"
    label       = "Desired minus running tasks"
    return_data = true
  }

  metric_query {
    id = "desired"

    metric {
      namespace   = "ECS/ContainerInsights"
      metric_name = "DesiredTaskCount"
      dimensions = {
        ClusterName = local.ecs_cluster_name
        ServiceName = "${local.name}-${each.key}"
      }
      period = 60
      stat   = "Average"
    }
  }

  metric_query {
    id = "running"

    metric {
      namespace   = "ECS/ContainerInsights"
      metric_name = "RunningTaskCount"
      dimensions = {
        ClusterName = local.ecs_cluster_name
        ServiceName = "${local.name}-${each.key}"
      }
      period = 60
      stat   = "Average"
    }
  }

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}

# Catches RUNNING-but-wedged, which the task-count alarm sits through. Maximum,
# not Minimum: the metric is per-AZ, so Minimum false-fires below one task per AZ.
resource "aws_cloudwatch_metric_alarm" "alb_no_healthy_targets" {
  count = local.alb_arn_suffix == null || local.target_group_arn_suffix == null ? 0 : 1

  alarm_name        = "${local.name}-no-healthy-targets"
  alarm_description = "Explorer has no healthy targets — the load balancer has nothing to route to."

  namespace   = "AWS/ApplicationELB"
  metric_name = "HealthyHostCount"
  dimensions = {
    LoadBalancer = local.alb_arn_suffix
    TargetGroup  = local.target_group_arn_suffix
  }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}

# The one alarm about the alerting path itself. Delivery is circular — it
# publishes to the topic whose consumer is broken — so read this in CloudWatch or
# Grafana rather than expecting it in Slack.
resource "aws_cloudwatch_metric_alarm" "alert_delivery_failing" {
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

# The load balancer's own 5xx, not the target's: 502/503 with nothing healthy to
# route to, 504 on the idle timeout.
resource "aws_cloudwatch_metric_alarm" "alb_elb_5xx" {
  count = local.alb_arn_suffix == null ? 0 : 1

  alarm_name        = "${local.name}-alb-5xx"
  alarm_description = "ALB returning 5xx — 502/503 with no healthy target to route to, or 504 from the idle timeout."

  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  dimensions          = { LoadBalancer = local.alb_arn_suffix }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}

# What the app actually returned, counted at the load balancer. The app's own
# 5xx rule in AMP is the inside view of the same failure and stays alongside it.
resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  count = local.alb_arn_suffix == null || local.target_group_arn_suffix == null ? 0 : 1

  alarm_name        = "${local.name}-target-5xx"
  alarm_description = "High target 5xx rate — the explorer has been returning more than 1 server error per second for over 5 minutes."

  namespace   = "AWS/ApplicationELB"
  metric_name = "HTTPCode_Target_5XX_Count"
  dimensions = {
    LoadBalancer = local.alb_arn_suffix
    TargetGroup  = local.target_group_arn_suffix
  }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 5
  comparison_operator = "GreaterThanThreshold"
  threshold           = 60
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}

# Reads either way round: a real flood, or a managed rule group false-positiving
# on legitimate traffic once it is flipped from Count to Block.
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  count = local.waf_web_acl_name == null ? 0 : 1

  alarm_name        = "${local.name}-waf-blocking-heavily"
  alarm_description = "WAF is blocking heavily — more than 5 requests per second have been blocked for over 10 minutes. Check the WAF log group for whether the source is hostile or a false positive."

  namespace   = "AWS/WAFV2"
  metric_name = "BlockedRequests"

  # Rule = ALL is the across-rules total WAF publishes next to the per-rule series.
  dimensions = {
    WebACL = local.waf_web_acl_name
    Rule   = "ALL"
    Region = var.aws_region
  }

  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 10
  datapoints_to_alarm = 10
  comparison_operator = "GreaterThanThreshold"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alerts_topic_arns
  ok_actions    = local.alerts_topic_arns
}
