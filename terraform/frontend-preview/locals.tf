locals {
  env  = yamldecode(file("../environments/preview/preview.yaml"))
  name = "${var.project}-preview-pr-${var.pr_number}"

  # terraform.workspace is pr-N here, so an inherited read resolves to nothing.
  dev_workspace = "dev"

  # Target group names cap at 32 characters, so this cannot reuse local.name.
  tg_name = "be-fe-pr-${var.pr_number}"

  host = "pr-${var.pr_number}.${local.env.domain_suffix}"
  url  = "https://${local.host}"

  # A pure function of the PR number: no allocator, no scan for a free slot.
  listener_rule_priority = 2000 + var.pr_number

  # Previews share dev's NAT, so they share its indexer rate limit and its token.
  indexer_secret_arn = try(data.terraform_remote_state.frontend.outputs.indexer_rate_limit_bypass_secret_arn, null)
}
