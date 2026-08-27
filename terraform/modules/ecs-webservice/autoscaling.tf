# CPU target tracking, off unless autoscaling_max_capacity is set. The service
# already ignores desired_count changes, which is what lets this own the count
# without every apply resetting it to the floor.
#
# CPU is the right signal here rather than RequestCountPerTarget: every page is
# server-rendered per request, so load shows up as CPU before it shows up as
# queueing.

locals {
  # Referenced, not rebuilt from var.name, so the target depends on the service.
  autoscaling_service_name = one(concat(aws_ecs_service.this[*].name, aws_ecs_service.rolling[*].name))

  # arn:aws:ecs:<region>:<account>:cluster/<name>
  cluster_name = element(split("/", var.cluster_arn), 1)

  autoscaling_enabled = var.autoscaling_max_capacity != null
}

resource "aws_appautoscaling_target" "this" {
  count = local.autoscaling_enabled ? 1 : 0

  service_namespace  = "ecs"
  resource_id        = "service/${local.cluster_name}/${local.autoscaling_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.desired_count
  max_capacity       = var.autoscaling_max_capacity

  lifecycle {
    precondition {
      condition     = var.autoscaling_max_capacity == null || var.autoscaling_max_capacity >= var.desired_count
      error_message = "autoscaling_max_capacity must be at least desired_count, which is the floor it scales from."
    }
  }
}

resource "aws_appautoscaling_policy" "cpu" {
  count = local.autoscaling_enabled ? 1 : 0

  name               = "${var.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.this[0].service_namespace
  resource_id        = aws_appautoscaling_target.this[0].resource_id
  scalable_dimension = aws_appautoscaling_target.this[0].scalable_dimension

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.autoscaling_cpu_target

    # Scaling out is cheap and scaling in is what drops connections, so out is
    # allowed every minute and in waits five.
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}
