# Container Insights is on because everything downstream reads it: the ECS
# task-count metrics, phase 2's tasks-below-desired alarms, and YACE's
# discovery all have nothing to scrape without it.
resource "aws_ecs_cluster" "this" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
