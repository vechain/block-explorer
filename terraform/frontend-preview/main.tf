# One PR's preview: a target group, one host-header rule on the shared preview
# listener, and an ECS service. Applied into workspace pr-<N> by
# deploy-preview.yml and destroyed by destroy-preview.yml or the reconcile sweep.
#
# Everything shared — the ALB, its listeners, the task security group and the
# wildcard DNS record — belongs to preview-edge/, so a teardown here removes
# exactly this PR and nothing else.

data "aws_ecr_repository" "app" {
  name = var.ecr_repository_name
}

data "terraform_remote_state" "network" {
  backend   = "s3"
  workspace = local.dev_workspace

  config = {
    bucket  = var.state_bucket
    key     = "network/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "ecs" {
  backend   = "s3"
  workspace = local.dev_workspace

  config = {
    bucket  = var.state_bucket
    key     = "ecs/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "preview_edge" {
  backend   = "s3"
  workspace = local.dev_workspace

  config = {
    bucket  = var.state_bucket
    key     = "preview-edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# Read only for the indexer bypass secret — previews share dev's egress IP.
data "terraform_remote_state" "frontend" {
  backend   = "s3"
  workspace = local.dev_workspace

  config = {
    bucket  = var.state_bucket
    key     = "frontend/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

resource "aws_lb_target_group" "preview" {
  name        = local.tg_name
  port        = local.env.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  # Previews are replaced outright rather than drained; a shorter delay is what
  # keeps a push-to-preview cycle short.
  deregistration_delay = 30
}

resource "aws_lb_listener_rule" "preview" {
  listener_arn = data.terraform_remote_state.preview_edge.outputs.https_listener_arn
  priority     = local.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.preview.arn
  }

  condition {
    host_header {
      values = [local.host]
    }
  }
}

module "service" {
  source = "../modules/ecs-webservice"

  name           = local.name
  aws_region     = var.aws_region
  cluster_arn    = data.terraform_remote_state.ecs.outputs.cluster_arn
  container_name = "frontend"
  image          = "${data.aws_ecr_repository.app.repository_url}:${var.image_tag}"
  container_port = local.env.container_port

  cpu           = local.env.task_cpu
  memory        = local.env.task_memory
  desired_count = local.env.desired_count

  subnet_ids         = data.terraform_remote_state.network.outputs.application_subnet_ids
  security_group_ids = [data.terraform_remote_state.preview_edge.outputs.app_security_group_id]
  target_group_arn   = aws_lb_target_group.preview.arn

  log_retention_days = local.env.log_retention_days

  # A single task, replaced rather than drained.
  deployment_minimum_healthy_percent = 0
  terraform_owns_task_definition     = true

  environment = {
    NODE_ENV = "production"
    PORT     = tostring(local.env.container_port)
    HOSTNAME = "0.0.0.0"
  }

  secrets = local.indexer_secret_arn == null ? {} : {
    INDEXER_RATE_LIMIT_BYPASS = local.indexer_secret_arn
  }

  # CreateService needs the group already attached to the ALB, and only the
  # rule's forward action attaches it — an edge Terraform cannot infer.
  depends_on = [aws_lb_listener_rule.preview]
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == "pr-${var.pr_number}"
      error_message = "Workspace must be pr-<pr_number> and match the pr_number variable — never default, dev or prod. Example: terraform workspace select -or-create pr-123 -var=pr_number=123"
    }
  }
}
