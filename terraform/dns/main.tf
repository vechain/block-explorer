# The prod account has no copy of block-explorer.vechain.org: both zones stay
# here so that phase 7's weighted pair can live in one zone, and so the cutover
# needs nothing from whoever owns vechain.org. This is the role the prod pipeline
# assumes to write its certificate validation record, and later its ALB alias.
#
# Route53 is global, so the records themselves are written from either account
# once this role exists — what crosses the boundary is permission, not data.

data "aws_route53_zone" "public" {
  for_each     = toset(var.public_zone_names)
  name         = each.key
  private_zone = false
}

data "aws_iam_policy_document" "assume" {
  count = local.enabled ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = [var.prod_deploy_role_arn]
    }
  }
}

resource "aws_iam_role" "dns_writer" {
  count = local.enabled ? 1 : 0

  name               = local.role_name
  description        = "Assumed by the prod pipeline to write records into this account's public zones"
  assume_role_policy = data.aws_iam_policy_document.assume[0].json
}

resource "aws_iam_role_policy" "dns_writer" {
  count = local.enabled ? 1 : 0

  name = local.role_name
  role = aws_iam_role.dns_writer[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "WriteListedZones"
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetHostedZone",
          "route53:ListResourceRecordSets",
          "route53:ListTagsForResource",
        ]
        Resource = local.zone_arns
      },
      {
        Sid      = "TrackChange"
        Effect   = "Allow"
        Action   = "route53:GetChange"
        Resource = "arn:aws:route53:::change/*"
      },
      # A zone lookup by name has no resource-level permissions, and it is how
      # every stack here resolves a zone id rather than hard-coding one.
      {
        Sid      = "FindZoneByName"
        Effect   = "Allow"
        Action   = ["route53:ListHostedZones", "route53:ListHostedZonesByName"]
        Resource = "*"
      },
    ]
  })
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == "dev"
      error_message = "dns/ is applied in the dev workspace only — it owns a role in the account holding the public zones."
    }
  }
}
