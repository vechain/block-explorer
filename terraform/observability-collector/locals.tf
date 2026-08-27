locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}-observability-collector"

  # This collector's own task, not the explorer's — YACE and ADOT idle around
  # 100 MB each. One task in both environments: CloudWatch ingestion is
  # idempotent, so a placement failure costs a gap in the graphs, not data.
  task_cpu      = 512
  task_memory   = 1024
  desired_count = 1

  # Read through try() so a first deploy — or a parallel plan — tolerates
  # upstream state that does not exist yet. The whole stack is count-gated on
  # the result, so no API call fires against the placeholder endpoint.
  amp_endpoint      = try(data.terraform_remote_state.observability_aws.outputs.amp_prometheus_endpoint, null)
  amp_workspace_arn = try(data.terraform_remote_state.observability_aws.outputs.amp_workspace_arn, null)
  cluster_arn       = try(data.terraform_remote_state.ecs.outputs.cluster_arn, null)

  # Null when the WAF is off, which drops the WAF scrape rather than polling nothing.
  waf_web_acl_name = try(data.terraform_remote_state.edge.outputs.waf_web_acl_name, null)

  collector_ready = local.amp_endpoint != null && local.amp_workspace_arn != null && local.cluster_arn != null
}
