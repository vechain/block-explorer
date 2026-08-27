# The CloudWatch side of observability: one Fargate task running YACE next to
# an ADOT collector, bridging CloudWatch metrics into AMP.
#
# Two collectors exist for a reason. This one is account-wide and reads the AWS
# control plane; modules/observability-sidecar rides along in each app task and
# reads that task. Neither can do the other's job.
#
# Everything is count-gated on collector_ready, so the stack plans cleanly
# against the empty observability-aws and ecs state of a first deploy.

data "terraform_remote_state" "network" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = var.state_bucket
    key     = "network/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "ecs" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = var.state_bucket
    key     = "ecs/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

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

data "terraform_remote_state" "observability_aws" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = var.state_bucket
    key     = "observability-aws/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

resource "aws_cloudwatch_log_group" "collector" {
  count = local.collector_ready ? 1 : 0

  name              = "/ecs/${local.name}"
  retention_in_days = local.env.log_retention_days
}

# --- IAM ---

resource "aws_iam_role" "execution" {
  count = local.collector_ready ? 1 : 0

  name = "${local.name}-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  count = local.collector_ready ? 1 : 0

  role       = aws_iam_role.execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task" {
  count = local.collector_ready ? 1 : 0

  name = "${local.name}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "task" {
  count = local.collector_ready ? 1 : 0

  name = "collector"
  role = aws_iam_role.task[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchRead"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "tag:GetResources",
        ]
        Resource = "*"
      },
      {
        # YACE calls this every scrape to label series with the account alias
        # instead of the bare account ID. Without it the metrics still land,
        # with a WARN per interval.
        Sid      = "IAMListAccountAliases"
        Effect   = "Allow"
        Action   = ["iam:ListAccountAliases"]
        Resource = "*"
      },
      {
        Sid      = "AMPRemoteWrite"
        Effect   = "Allow"
        Action   = ["aps:RemoteWrite"]
        Resource = local.amp_workspace_arn
      },
    ]
  })
}

# No ingress: the task only ever originates requests, and the two containers
# reach each other over the task's own loopback.
resource "aws_security_group" "collector" {
  count = local.collector_ready ? 1 : 0

  name        = "${local.name}-sg"
  description = "Observability collector task. No inbound; HTTPS out to the AWS APIs."
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  egress {
    description      = "HTTPS to CloudWatch, AMP, STS, ECR and CloudWatch Logs."
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

# --- Task definition ---

resource "aws_ecs_task_definition" "collector" {
  count = local.collector_ready ? 1 : 0

  family                   = local.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(local.task_cpu)
  memory                   = tostring(local.task_memory)
  execution_role_arn       = aws_iam_role.execution[0].arn
  task_role_arn            = aws_iam_role.task[0].arn

  # Both images publish amd64 and arm64, so this matches the app service rather
  # than paying x86 rates for a sidecar pair.
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "yace"
      image     = "quay.io/prometheuscommunity/yet-another-cloudwatch-exporter:${var.yace_image_tag}"
      essential = true

      # A read-only rootfs leaves YACE, which runs as `nobody`, unable to write its config.
      readonlyRootFilesystem = false

      # YACE takes --config.file, so the wrapper writes it out and execs as PID 1.
      # scraping-interval defaults to 300s: ADOT would replay one Sum five times.
      entryPoint = ["/bin/sh", "-c"]
      command    = ["printf '%s' \"$YACE_CONFIG\" > /tmp/yace.yml && exec /bin/yace --config.file=/tmp/yace.yml --listen-address=:5000 --scraping-interval=60"]

      environment = [
        {
          name = "YACE_CONFIG"
          value = templatefile("${path.module}/yace-config.yaml.tftpl", {
            aws_region  = var.aws_region
            project     = var.project
            env         = terraform.workspace
            waf_enabled = local.waf_web_acl_name != null
          })
        },
      ]

      portMappings = [{ containerPort = 5000, protocol = "tcp" }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.collector[0].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "yace"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget -q --spider http://127.0.0.1:5000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    },
    {
      name      = "adot"
      image     = "public.ecr.aws/aws-observability/aws-otel-collector:${var.adot_image_tag}"
      essential = true

      # FROM scratch and nothing is spooled to disk, so this one keeps the
      # read-only rootfs.
      readonlyRootFilesystem = true
      command                = ["--config=env:CONFIG_CONTENT"]

      environment = [
        {
          name = "CONFIG_CONTENT"
          value = templatefile("${path.module}/adot-config.yaml.tftpl", {
            amp_endpoint = local.amp_endpoint
            aws_region   = var.aws_region
            env          = terraform.workspace
          })
        },
      ]

      # Without this the first scrape races YACE's HTTP server and gets a refusal.
      dependsOn = [{ containerName = "yace", condition = "HEALTHY" }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.collector[0].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "adot"
        }
      }

      # The ADOT image has no shell, so CMD-SHELL would exit before probing.
      # AWS ships /healthcheck, which hits the health_check extension.
      healthCheck = {
        command     = ["CMD", "/healthcheck"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    },
  ])
}

resource "aws_ecs_service" "collector" {
  count = local.collector_ready ? 1 : 0

  name            = local.name
  cluster         = local.cluster_arn
  task_definition = aws_ecs_task_definition.collector[0].arn
  desired_count   = local.desired_count
  launch_type     = "FARGATE"

  # No ignore_changes, unlike the app service: Terraform owns the image tags here,
  # so a task definition change is the only thing that ever rolls this.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = data.terraform_remote_state.network.outputs.application_subnet_ids
    security_groups  = [aws_security_group.collector[0].id]
    assign_public_ip = false
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
