locals {
  name       = "${var.project}-${terraform.workspace}"
  account_id = data.aws_caller_identity.current.account_id

  gha_role_name = "${var.project}-github-actions-${terraform.workspace}"

  # From the backend config, so the grant cannot name another bucket. try() is for validate.
  state_bucket = try(regex("bucket\\s*=\\s*\"([^\"]+)\"", file("../environments/${terraform.workspace}/backend.config"))[0], "")

  # Keyed by workspace rather than taken from a -var: this stack is applied by
  # hand, and a forgotten flag would apply one account's grants to the other.
  accounts = {
    prod = {
      create_ecr = true

      gha_subjects = ["repo:vechain/block-explorer:environment:prod"]

      # Route53 writes go through dns/'s role in the other account.
      public_zone_names   = []
      readable_zone_names = []

      foreign_state_bucket_names = ["explore-terraform-state-prod"]

      pipeline_role_name_patterns = ["${var.project}-prod-*"]
    }

    dev = {
      # account-level/'s, and its lifecycle rules keep the dev- and pr- tags.
      create_ecr = false

      # Four, because dev runs more than a deploy: previews publish under their own
      # environment, tear down on a bare pull_request, and are swept from main.
      gha_subjects = [
        "repo:vechain/block-explorer:environment:dev",
        "repo:vechain/block-explorer:environment:preview",
        "repo:vechain/block-explorer:pull_request",
        "repo:vechain/block-explorer:ref:refs/heads/main",
      ]

      # The two dev writes itself rather than assuming dns/'s role.
      public_zone_names = ["block-explorer.vechain.org", "block-explorer-preview.vechain.org"]

      # dns/ resolves this one to grant the prod role; no dev record lives in it.
      readable_zone_names = ["explore.vechain.org"]

      foreign_state_bucket_names = [
        "explore-terraform-state-dev",
        "terragrunt-terraform-fe-state-explorer-dev-eu-west-1",
        "faucet-app-terraform-state-prod",
        "indexer-insights-tf-state",
        # The legacy prod state, in this account and no business of dev's.
        "block-explorer-terraform-state-prod",
      ]

      # dns/ is applied in this workspace but names its role for the account that
      # assumes it, so it does not match the <project>-<workspace>-* shape.
      pipeline_role_name_patterns = [
        "${var.project}-dev-*",
        "${var.project}-prod-dns-writer",
      ]
    }
  }

  # The fallback only lets `terraform validate` typecheck; the guard rejects the workspace.
  account = lookup(local.accounts, terraform.workspace, {
    create_ecr                  = false
    gha_subjects                = ["repo:vechain/block-explorer:environment:none"]
    public_zone_names           = []
    readable_zone_names         = []
    foreign_state_bucket_names  = []
    pipeline_role_name_patterns = []
  })

  # Excludes gha_role_name, which is <project>-github-actions-<workspace>: the
  # pipeline must not be able to widen its own grants.
  pipeline_role_arns = [
    for pattern in local.account.pipeline_role_name_patterns :
    "arn:aws:iam::${local.account_id}:role/${pattern}"
  ]

  ecr_repository_arn = local.account.create_ecr ? one(aws_ecr_repository.app[*].arn) : one(data.aws_ecr_repository.existing[*].arn)
  ecr_repository_url = local.account.create_ecr ? one(aws_ecr_repository.app[*].repository_url) : one(data.aws_ecr_repository.existing[*].repository_url)

  zone_arns          = [for z in data.aws_route53_zone.public : z.arn]
  readable_zone_arns = [for z in data.aws_route53_zone.readable : z.arn]

  # Every managed policy the stacks attach to a role they create. Adding a
  # statement to an inline policy needs no entry here; attaching one does.
  attachable_managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess",
    "arn:aws:iam::aws:policy/AmazonPrometheusQueryAccess",
  ]

  state_bucket_arns = [
    "arn:aws:s3:::${local.state_bucket}",
    "arn:aws:s3:::${local.state_bucket}/*",
  ]

  foreign_state_bucket_arns = flatten([
    for b in local.account.foreign_state_bucket_names : ["arn:aws:s3:::${b}", "arn:aws:s3:::${b}/*"]
  ])

  foreign_ecr_arns = [
    for r in var.foreign_ecr_repository_names : "arn:aws:ecr:${var.aws_region}:${local.account_id}:repository/${r}"
  ]

  # Services whose service-linked role may not exist yet in this account.
  service_linked_role_services = [
    "wafv2.amazonaws.com",
    "grafana.amazonaws.com",
    "aps.amazonaws.com",
  ]
}
