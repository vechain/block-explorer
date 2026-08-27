locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  env          = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name         = "${var.project}-${terraform.workspace}-frontend"

  # Mirrors ecs-webservice's naming: reading its output here would be a cycle.
  log_group_name = "/ecs/${local.name}"

  # The sidecar has nowhere to write until phase 2 creates AMP, so its state is
  # read through try() and the container is only appended once both outputs
  # resolve. Keeps a first apply — and a parallel plan — working against an
  # upstream stack that does not exist yet.
  amp_endpoint      = try(data.terraform_remote_state.observability_aws.outputs.amp_prometheus_endpoint, null)
  amp_workspace_arn = try(data.terraform_remote_state.observability_aws.outputs.amp_workspace_arn, null)
  sidecar_ready     = local.amp_endpoint != null && local.amp_workspace_arn != null

  # Read the same way, for the same reason: without the data/ stack the app keeps
  # its per-task caches rather than failing to start.
  redis_url_secret_arn = try(data.terraform_remote_state.cache.outputs.redis_url_secret_arn, null)
  cache_ready          = local.redis_url_secret_arn != null
}
