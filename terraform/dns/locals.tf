locals {
  # Named for the account that assumes it, not the workspace that owns it: the
  # public zones live here, so this stack is applied in dev while the only
  # principal using the role is the prod pipeline. bootstrap/ grants
  # sts:AssumeRole on exactly this name.
  role_name = "${var.project}-prod-dns-writer"

  enabled = var.prod_deploy_role_arn != ""

  zone_arns = [for z in data.aws_route53_zone.public : z.arn]
}
