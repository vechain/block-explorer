# This repo's own deploy role, replacing the shared one. Applied by hand, never by
# the pipeline, so nothing below grants iam on the role itself. See README.md.

data "aws_caller_identity" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# Only where the pipeline writes records itself. prod's go through dns/'s role.
data "aws_route53_zone" "public" {
  for_each = toset(local.account.public_zone_names)

  name         = each.key
  private_zone = false
}

# Resolved by a stack but never written by it, so a dev apply cannot reach records in
# a name prod answers on.
data "aws_route53_zone" "readable" {
  for_each = toset(local.account.readable_zone_names)

  name         = each.key
  private_zone = false
}

# checkov's CKV_AWS_358 cannot resolve a per-workspace list, so the role's precondition covers it.
data "aws_iam_policy_document" "gha_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    # configure-aws-credentials requests sts.amazonaws.com; without pinning it,
    # a token minted for another audience still satisfies the subject test.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.account.gha_subjects
    }
  }
}

# prevent_destroy throughout: a destroy that removes the policies and then fails
# on the role leaves an orphan the pipeline cannot recover from without
# out-of-band access to the account.
resource "aws_iam_role" "gha" {
  name                 = local.gha_role_name
  description          = "Scoped GitHub Actions deploy role for vechain/block-explorer in this account"
  assume_role_policy   = data.aws_iam_policy_document.gha_assume.json
  max_session_duration = 3600

  lifecycle {
    prevent_destroy = true

    # StringEquals already rejects a wildcard, so this catches the review-time
    # mistake rather than a runtime one: a subject for another repo, or the
    # trailing `:*` that made the shared role assumable from any branch.
    precondition {
      condition = alltrue([
        for s in local.account.gha_subjects :
        startswith(s, "repo:vechain/block-explorer:") && !endswith(s, ":*")
      ])
      error_message = "Every OIDC subject must name this repo and be fully qualified. Example: repo:vechain/block-explorer:environment:dev"
    }
  }
}

resource "aws_iam_policy" "gha" {
  name        = local.gha_role_name
  description = "Deploy grants for vechain/block-explorer GitHub Actions"
  policy      = data.aws_iam_policy_document.gha_allow.json

  lifecycle {
    prevent_destroy = true

    # AWS strips whitespace before applying the 6144 character limit.
    precondition {
      condition     = length(replace(data.aws_iam_policy_document.gha_allow.json, "/\\s+/", "")) < 6144
      error_message = "Grants exceed the 6144 character managed-policy limit. Split the statements into a second attached policy."
    }
  }
}

resource "aws_iam_policy" "gha_guardrails" {
  name        = "${local.gha_role_name}-guardrails"
  description = "Cross-project denies for vechain/block-explorer GitHub Actions"
  policy      = data.aws_iam_policy_document.gha_deny.json

  lifecycle {
    prevent_destroy = true

    precondition {
      condition     = length(replace(data.aws_iam_policy_document.gha_deny.json, "/\\s+/", "")) < 6144
      error_message = "Guardrails exceed the 6144 character managed-policy limit. Split the statements into a second attached policy."
    }
  }
}

resource "aws_iam_role_policy_attachment" "gha" {
  role       = aws_iam_role.gha.name
  policy_arn = aws_iam_policy.gha.arn

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_iam_role_policy_attachment" "gha_guardrails" {
  role       = aws_iam_role.gha.name
  policy_arn = aws_iam_policy.gha_guardrails.arn

  lifecycle {
    prevent_destroy = true
  }
}

# Guardrails: IAM evaluates the union of a principal's policies, and a Deny wins.
data "aws_iam_policy_document" "gha_deny" {
  # Anything carrying another project's Project tag, rather than a list of the
  # names they use today. The Null test exempts untagged resources — a create
  # carries no tag yet, and several services below never surface
  # aws:ResourceTag — so this bounds the broad grants without narrowing them.
  statement {
    sid    = "DenyForeignProjectResources"
    effect = "Deny"
    actions = [
      "acm:*",
      "application-autoscaling:*",
      "aps:*",
      "cloudfront:*",
      "cloudfront-keyvaluestore:*",
      "cloudwatch:*",
      "ec2:*",
      "ecs:*",
      "elasticache:*",
      "elasticloadbalancing:*",
      "grafana:*",
      "lambda:*",
      "logs:*",
      "secretsmanager:*",
      "sns:*",
      "wafv2:*",
    ]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Project"
      values   = [var.project]
    }

    condition {
      test     = "Null"
      variable = "aws:ResourceTag/Project"
      values   = ["false"]
    }
  }

  statement {
    sid       = "DenyForeignStateBuckets"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = local.foreign_state_bucket_arns
  }

  statement {
    sid       = "DenyForeignRegistries"
    effect    = "Deny"
    actions   = ["ecr:*"]
    resources = local.foreign_ecr_arns
  }

  statement {
    sid    = "DenyIdentityCreation"
    effect = "Deny"
    actions = [
      "iam:CreateUser",
      "iam:CreateAccessKey",
      "iam:AttachUserPolicy",
      "iam:PutUserPolicy",
      "iam:CreateLoginProfile",
      "iam:UpdateLoginProfile",
      "iam:CreateSAMLProvider",
      "iam:UpdateSAMLProvider",
      "iam:UpdateOpenIDConnectProviderThumbprint",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "DenyAccountAndOrganizationChanges"
    effect    = "Deny"
    actions   = ["organizations:*", "account:*", "iam:CreateAccountAlias", "iam:DeleteAccountAlias"]
    resources = ["*"]
  }

  statement {
    sid    = "DenyAuditTampering"
    effect = "Deny"
    actions = [
      "cloudtrail:StopLogging",
      "cloudtrail:DeleteTrail",
      "cloudtrail:UpdateTrail",
      "cloudtrail:PutEventSelectors",
      "config:DeleteConfigurationRecorder",
      "config:StopConfigurationRecorder",
    ]
    resources = ["*"]
  }
}

# ---------------------------------------------------------------------------
# Grants. Scoped by ARN wherever the service supports resource-level
# permissions; the rest is bounded by the guardrails above.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "gha_allow" {
  statement {
    sid       = "StateBucket"
    effect    = "Allow"
    actions   = ["s3:*"]
    resources = local.state_bucket_arns
  }

  # The bucket cdn/ creates for published bundles and each environment's runtime-config.json.
  statement {
    sid     = "BundleBucket"
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${local.name}-app-${local.account_id}",
      "arn:aws:s3:::${local.name}-app-${local.account_id}/*",
    ]
  }

  # ecs:RegisterTaskDefinition, elasticloadbalancing:CreateLoadBalancer and the
  # Describe* families have no resource-level permissions, and none of the ec2
  # network creates can be pinned to an ARN that does not exist yet.
  statement {
    sid    = "Platform"
    effect = "Allow"
    actions = [
      "acm:*",
      "application-autoscaling:*",
      "cloudfront:*",
      "cloudfront-keyvaluestore:*",
      "ec2:*",
      "ecs:*",
      "elasticache:*",
      "elasticloadbalancing:*",
      "wafv2:*",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "Registry"
    effect    = "Allow"
    actions   = ["ecr:*"]
    resources = [local.ecr_repository_arn]
  }

  # Account-wide by design: the token authorises a docker login, not a repository.
  statement {
    sid       = "RegistryAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken", "ecr:DescribeRegistry"]
    resources = ["*"]
  }

  # Every log group this repo creates carries the project in its name:
  # /ecs/block-explorer-*, aws-waf-logs-block-explorer-*,
  # /aws/prometheus/block-explorer-*, /aws/lambda/block-explorer-*.
  statement {
    sid     = "OwnLogGroups"
    effect  = "Allow"
    actions = ["logs:*"]
    resources = distinct([
      "arn:aws:logs:${var.aws_region}:${local.account_id}:log-group:*${var.project}*",
      # CLOUDFRONT-scope WAF logs are delivered in us-east-1 whatever the stack's region.
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:*${var.project}*",
    ])
  }

  # WAF's own requirement for a CloudWatch Logs destination, none of it scopable.
  statement {
    sid    = "LogDelivery"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
      "logs:CreateLogDelivery",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "OwnAlarms"
    effect    = "Allow"
    actions   = ["cloudwatch:*"]
    resources = ["arn:aws:cloudwatch:${var.aws_region}:${local.account_id}:alarm:${local.name}-*"]
  }

  statement {
    sid       = "MetricRead"
    effect    = "Allow"
    actions   = ["cloudwatch:DescribeAlarms", "cloudwatch:GetMetricData", "cloudwatch:ListMetrics"]
    resources = ["*"]
  }

  # AMP and Grafana workspace ids are generated at create time, so there is no
  # ARN to pin before the first apply.
  statement {
    sid       = "Observability"
    effect    = "Allow"
    actions   = ["aps:*", "grafana:*"]
    resources = ["*"]
  }

  statement {
    sid     = "OwnTopicsAndFunctions"
    effect  = "Allow"
    actions = ["sns:*", "lambda:*"]
    resources = [
      "arn:aws:sns:${var.aws_region}:${local.account_id}:${local.name}-*",
      "arn:aws:lambda:${var.aws_region}:${local.account_id}:function:${local.name}-*",
    ]
  }

  statement {
    sid       = "TopicAndFunctionListing"
    effect    = "Allow"
    actions   = ["sns:ListTopics", "lambda:ListFunctions", "lambda:GetAccountSettings"]
    resources = ["*"]
  }

  # Both naming shapes this repo uses: block-explorer/<env>/<name> for the
  # indexer token, and block-explorer-<env>-<name> for anything holding a
  # password or an admin token.
  statement {
    sid       = "OwnSecrets"
    effect    = "Allow"
    actions   = ["secretsmanager:*"]
    resources = ["arn:aws:secretsmanager:${var.aws_region}:${local.account_id}:secret:${var.project}*"]
  }

  statement {
    sid       = "SecretListing"
    effect    = "Allow"
    actions   = ["secretsmanager:ListSecrets"]
    resources = ["*"]
  }

  # Every role the stacks create. Excludes this one, which carries github-actions.
  statement {
    sid    = "OwnServiceRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:PassRole",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:GetRolePolicy",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
    ]
    resources = local.pipeline_role_arns
  }

  # Only the four AWS managed policies the stacks actually attach. Unconditional,
  # this is an escalation path: attach AdministratorAccess to a role the pipeline
  # may also pass, and a task or Lambda it creates is account admin.
  statement {
    sid       = "AttachKnownManagedPolicies"
    effect    = "Allow"
    actions   = ["iam:AttachRolePolicy", "iam:DetachRolePolicy"]
    resources = local.pipeline_role_arns

    condition {
      test     = "ArnEquals"
      variable = "iam:PolicyARN"
      values   = local.attachable_managed_policy_arns
    }
  }

  # No resource-level permissions on any of these; all read-only metadata a plan
  # needs.
  statement {
    sid       = "IamRead"
    effect    = "Allow"
    actions   = ["iam:ListRoles", "iam:ListPolicies", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListOpenIDConnectProviders", "iam:GetOpenIDConnectProvider"]
    resources = ["*"]
  }

  statement {
    sid       = "ServiceLinkedRoles"
    effect    = "Allow"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = local.service_linked_role_services
    }
  }

  # Lambda encrypts its environment with alias/aws/lambda on create, and reading
  # a secret version back needs the Secrets Manager default key.
  statement {
    sid       = "KmsViaService"
    effect    = "Allow"
    actions   = ["kms:CreateGrant", "kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["lambda.${var.aws_region}.amazonaws.com", "secretsmanager.${var.aws_region}.amazonaws.com"]
    }
  }

  # Whichever account holds the zones writes them directly; the other assumes dns/'s role.
  dynamic "statement" {
    for_each = length(local.zone_arns) == 0 ? [1] : []

    content {
      # Wildcarded on account: naming one would put an account id in a public repo.
      sid       = "AssumeDnsWriter"
      effect    = "Allow"
      actions   = ["sts:AssumeRole"]
      resources = ["arn:aws:iam::*:role/${var.project}-prod-dns-writer"]
    }
  }

  # Pinned to our two: this account also holds the legacy explorer's zones.
  dynamic "statement" {
    for_each = length(local.zone_arns) == 0 ? [] : [1]

    content {
      sid    = "OwnZones"
      effect = "Allow"
      actions = [
        "route53:ChangeResourceRecordSets",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "route53:ListTagsForResource",
      ]
      resources = local.zone_arns
    }
  }

  dynamic "statement" {
    for_each = length(local.readable_zone_arns) == 0 ? [] : [1]

    content {
      sid    = "ResolveOtherZones"
      effect = "Allow"
      actions = [
        "route53:GetHostedZone",
        "route53:ListTagsForResource",
      ]
      resources = local.readable_zone_arns
    }
  }

  dynamic "statement" {
    for_each = length(local.zone_arns) == 0 ? [] : [1]

    content {
      sid       = "TrackZoneChange"
      effect    = "Allow"
      actions   = ["route53:GetChange"]
      resources = ["arn:aws:route53:::change/*"]
    }
  }

  # How every stack resolves a zone id rather than hard-coding one; not scopable.
  dynamic "statement" {
    for_each = length(local.zone_arns) == 0 ? [] : [1]

    content {
      sid       = "FindZoneByName"
      effect    = "Allow"
      actions   = ["route53:ListHostedZones", "route53:ListHostedZonesByName"]
      resources = ["*"]
    }
  }
}
