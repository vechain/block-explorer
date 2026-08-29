# The explorer's ECS service, registered against the target group edge/ owns.
#
# Apply order on a fresh environment:
#   network -> ecs -> acm -> edge -> frontend

data "aws_ecr_repository" "app" {
  name = var.ecr_repository_name
}

data "terraform_remote_state" "network" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "network/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "ecs" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "ecs/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "edge" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "cache" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "data/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "observability_aws" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "observability-aws/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# NAT egress collapses every server-side indexer call onto one IP, so the
# indexer's per-IP limit now applies environment-wide. Seeded blank because
# env.api.ts reads blank as unset, so a wrong token is never sent.
resource "aws_secretsmanager_secret" "indexer_rate_limit_bypass" {
  name        = "block-explorer/${terraform.workspace}/indexer-rate-limit-bypass"
  description = "x-rate-limit-bypass token for server-side VeWorld indexer calls"
}

resource "aws_secretsmanager_secret_version" "indexer_rate_limit_bypass" {
  secret_id     = aws_secretsmanager_secret.indexer_rate_limit_bypass.id
  secret_string = " "

  lifecycle {
    ignore_changes = [secret_string]
  }
}

module "observability_sidecar" {
  source = "../modules/observability-sidecar"

  service_name   = "frontend"
  env            = terraform.workspace
  aws_region     = var.aws_region
  app_port       = local.env.container_port
  log_group_name = local.log_group_name

  # Placeholders keep the module plannable before phase 2 exists; the container
  # it renders is not attached to the task until sidecar_ready.
  amp_endpoint      = coalesce(local.amp_endpoint, "https://placeholder.invalid/")
  amp_workspace_arn = coalesce(local.amp_workspace_arn, "arn:aws:aps:${var.aws_region}:000000000000:workspace/placeholder")
}

module "service" {
  source = "../modules/ecs-webservice"

  name           = local.name
  aws_region     = var.aws_region
  cluster_arn    = data.terraform_remote_state.ecs.outputs.cluster_arn
  container_name = "frontend"
  image          = "${data.aws_ecr_repository.app.repository_url}:${local.env.image_tag}"
  container_port = local.env.container_port

  cpu           = local.env.task_cpu
  memory        = local.env.task_memory
  desired_count = local.env.desired_count

  autoscaling_max_capacity                 = local.env.autoscaling_max
  autoscaling_request_count_target         = local.env.autoscaling_request_count_target
  autoscaling_request_count_resource_label = "${data.terraform_remote_state.edge.outputs.alb_arn_suffix}/${data.terraform_remote_state.edge.outputs.target_group_arn_suffix}"

  subnet_ids         = data.terraform_remote_state.network.outputs.application_subnet_ids
  security_group_ids = [data.terraform_remote_state.edge.outputs.app_security_group_id]
  target_group_arn   = data.terraform_remote_state.edge.outputs.target_group_arn

  log_retention_days                 = local.env.log_retention_days
  deployment_minimum_healthy_percent = terraform.workspace == "prod" ? 100 : 50

  # First, so a stray key in the env YAML cannot shadow what follows.
  environment = merge(local.env.runtime_environment, {
    NODE_ENV = "production"
    PORT     = tostring(local.env.container_port)
    HOSTNAME = "0.0.0.0"
    # The deploy pins this to the image, so a no-op release registers no revision.
    APP_VERSION = local.env.app_version
    # Must outlive the ALB's 60s idle_timeout, or it reuses a socket Node has closed.
    KEEP_ALIVE_TIMEOUT = "65000"
    # Safe only because the ALB returns a fixed 403 for /api/metrics; the
    # sidecar scrapes it over the task's loopback instead.
    METRICS_ENABLED = "true"
    }, local.cache_ready ? {
    REDIS_CLUSTER_MODE = "true"
    # Cache keys carry the tag, so a build cannot read a payload shape it did
    # not write out of a cache dev shares with every preview.
    CACHE_NAMESPACE = local.env.image_tag
  } : {})

  secrets = merge({
    INDEXER_RATE_LIMIT_BYPASS = aws_secretsmanager_secret.indexer_rate_limit_bypass.arn
    }, local.cache_ready ? {
    REDIS_URL = local.redis_url_secret_arn
  } : {})

  extra_container_definitions = local.sidecar_ready ? [module.observability_sidecar.container_definition] : []
  task_role_policy_json       = local.sidecar_ready ? module.observability_sidecar.amp_write_policy_json : null

  # The secret needs a resolvable version before a task can start.
  depends_on = [aws_secretsmanager_secret_version.indexer_rate_limit_bypass]
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
