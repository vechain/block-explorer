locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}-frontend"

  # Mirrors ecs-webservice's naming: reading its output here would be a cycle.
  log_group_name = "/ecs/${local.name}"

  # The sidecar has nowhere to write until phase 2 creates AMP, so its state is
  # read through try() and the container is only appended once both outputs
  # resolve. Keeps a first apply — and a parallel plan — working against an
  # upstream stack that does not exist yet.
  amp_endpoint      = try(data.terraform_remote_state.observability_aws.outputs.amp_prometheus_endpoint, null)
  amp_workspace_arn = try(data.terraform_remote_state.observability_aws.outputs.amp_workspace_arn, null)
  sidecar_ready     = local.amp_endpoint != null && local.amp_workspace_arn != null
}
