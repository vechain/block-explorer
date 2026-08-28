locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}"

  # A set, not a count: count types domain_name null and fails validate in dev.
  extra_domains = toset(compact([try(local.env.extra_domain.name, null)]))
}
