locals {
  name       = "${var.project}-${terraform.workspace}"
  account_id = data.aws_caller_identity.current.account_id

  gha_role_name = "${var.project}-github-actions-${terraform.workspace}"

  # Every role the pipeline creates is named <project>-<workspace>-<role>, so
  # this pattern covers all of them and excludes gha_role_name above: the
  # pipeline must not be able to widen its own grants.
  pipeline_role_arns = [
    "arn:aws:iam::${local.account_id}:role/${local.name}-*",
  ]

  # Every managed policy the stacks attach to a role they create. Adding a
  # statement to an inline policy needs no entry here; attaching one does.
  attachable_managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess",
    "arn:aws:iam::aws:policy/AmazonPrometheusQueryAccess",
  ]

  state_bucket_arns = [
    "arn:aws:s3:::${var.state_bucket}",
    "arn:aws:s3:::${var.state_bucket}/*",
  ]

  foreign_state_bucket_arns = flatten([
    for b in var.foreign_state_bucket_names : ["arn:aws:s3:::${b}", "arn:aws:s3:::${b}/*"]
  ])

  foreign_ecr_arns = [
    for r in var.foreign_ecr_repository_names : "arn:aws:ecr:${var.aws_region}:${local.account_id}:repository/${r}"
  ]

  # Services whose service-linked role may not exist yet in this account.
  service_linked_role_services = [
    "ecs.amazonaws.com",
    "elasticache.amazonaws.com",
    "elasticloadbalancing.amazonaws.com",
    "ecs.application-autoscaling.amazonaws.com",
    "wafv2.amazonaws.com",
    "grafana.amazonaws.com",
    "aps.amazonaws.com",
  ]
}
