locals {
  # The bucket the backend itself points at, so a prod apply cannot fall back to dev's.
  state_bucket = coalesce(var.state_bucket, regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0])
  env          = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name         = "${var.project}-${terraform.workspace}"

  # Previews exist only in explorer-dev, so in prod this read resolves to nothing
  # and the cache takes ingress from the environment's own tasks alone.
  app_security_group_id     = try(data.terraform_remote_state.edge.outputs.app_security_group_id, null)
  preview_security_group_id = try(data.terraform_remote_state.preview_edge[0].outputs.app_security_group_id, null)

  cache_endpoint = one(aws_elasticache_serverless_cache.valkey.endpoint)

  client_security_group_ids = merge(
    local.app_security_group_id == null ? {} : { app = local.app_security_group_id },
    local.preview_security_group_id == null ? {} : { preview = local.preview_security_group_id },
  )
}
