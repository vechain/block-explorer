################################################################################
# App Runner Service
################################################################################

# Auto-scaling configuration is managed at the account level to avoid hitting
# the 10 unique configuration name quota. We reference the shared configurations
# based on the environment type (prod vs preview).
#
# See: terraform/account-level/autoscaling.tf

locals {
  # Use production config for "prod" environment, otherwise use shared preview config
  autoscaling_config_arn = local.env.environment == "prod" ? data.terraform_remote_state.account_level.outputs.autoscaling_config_prod_arn : data.terraform_remote_state.account_level.outputs.autoscaling_config_preview_arn
}

# App Runner Service
resource "aws_apprunner_service" "frontend" {
  service_name = "${local.env.environment}-block-explorer"

  source_configuration {
    authentication_configuration {
      access_role_arn = data.terraform_remote_state.account_level.outputs.app_runner_access_role_arn
    }

    image_repository {
      image_identifier      = "${data.terraform_remote_state.account_level.outputs.ecr_repository_url}:${local.env.image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = tostring(local.env.port)

        # Runtime environment variables
        runtime_environment_variables = merge(
          {
            NODE_ENV = local.env.node_env
            PORT     = tostring(local.env.port)
            HOSTNAME = "0.0.0.0"
          },
          lookup(local.env, "environment_variables", {})
        )
      }
    }

    auto_deployments_enabled = false # We'll handle deployments via GitHub Actions
  }

  instance_configuration {
    cpu               = tostring(local.env.cpu)
    memory            = tostring(local.env.memory)
    instance_role_arn = data.terraform_remote_state.account_level.outputs.app_runner_instance_role_arn
  }

  auto_scaling_configuration_arn = local.autoscaling_config_arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = local.env.health_check_path
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${local.env.environment}-block-explorer"
    Environment = local.env.environment
  }
}

################################################################################
# Custom Domain Association
################################################################################

resource "aws_apprunner_custom_domain_association" "frontend" {
  count = local.env.enable_custom_domain ? 1 : 0

  domain_name          = local.env.domain
  service_arn          = aws_apprunner_service.frontend.arn
  enable_www_subdomain = false

  depends_on = [aws_apprunner_service.frontend]
}
