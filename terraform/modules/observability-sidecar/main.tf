# ADOT sidecar injected into each app task. Two receivers: awsecscontainermetrics
# for per-task cgroup CPU/memory/network/disk, and a prometheus scrape of the
# app's own /api/metrics.
#
# Emits nothing useful until phase 2 creates the AMP workspace — callers gate
# the container on that state existing.

variable "service_name" {
  type        = string
  description = "Short service name. Becomes the `service` external label."
}

variable "env" {
  type        = string
  description = "dev or prod. Becomes the `env` external label."
}

variable "aws_region" {
  type        = string
  description = "Region used for SigV4 signing to AMP."
}

variable "amp_endpoint" {
  type        = string
  description = "AMP workspace endpoint, trailing slash preserved."
}

variable "amp_workspace_arn" {
  type        = string
  description = "AMP workspace ARN — the Resource on the aps:RemoteWrite statement."
}

variable "log_group_name" {
  type        = string
  description = "CloudWatch log group the sidecar writes to. Shared with the app container."
}

variable "app_port" {
  type        = number
  default     = null
  description = "When set, the sidecar scrapes 127.0.0.1:<port>/api/metrics in the same task. Null disables the prometheus receiver, leaving only cgroup metrics."
}

variable "adot_image_tag" {
  type        = string
  default     = "v0.46.0"
  description = "aws-otel-collector image tag pin."
}

variable "memory_reservation" {
  type        = number
  default     = 128
  description = "Soft memory reservation (MiB)."
}

output "container_definition" {
  description = "Entry to append to the task's container_definitions."
  value = {
    name  = "adot-metrics"
    image = "public.ecr.aws/aws-observability/aws-otel-collector:${var.adot_image_tag}"
    # A sidecar crash must not restart the app. Losing metrics beats a
    # restart loop triggered by a cold-start scrape failure.
    essential              = false
    readonlyRootFilesystem = true
    memoryReservation      = var.memory_reservation
    command                = ["--config=env:CONFIG_CONTENT"]

    environment = [
      {
        name = "CONFIG_CONTENT"
        value = templatefile("${path.module}/otel-config.yaml.tftpl", {
          aws_region   = var.aws_region
          env          = var.env
          service_name = var.service_name
          amp_endpoint = var.amp_endpoint
          app_port     = var.app_port
        })
      },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "adot-sidecar"
      }
    }

    # The ADOT image is FROM scratch, so CMD-SHELL would exit before running.
    # AWS ships a /healthcheck binary that hits the health_check extension.
    healthCheck = {
      command     = ["CMD", "/healthcheck"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }
}

output "amp_write_policy_json" {
  description = "aps:RemoteWrite on the AMP workspace, to attach to the task role."
  value = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AMPRemoteWrite"
        Effect   = "Allow"
        Action   = ["aps:RemoteWrite"]
        Resource = var.amp_workspace_arn
      },
    ]
  })
}
