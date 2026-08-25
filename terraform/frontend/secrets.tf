################################################################################
# Indexer Rate Limit Bypass
################################################################################

# The cached indexer proxy funnels every user's request through one App Runner IP, so
# the indexer's per-IP rate limit would apply to the whole app at once. This token lifts
# it. Prod only: preview traffic stays well under the limit, and Secrets Manager's
# deletion recovery window would collide with a preview environment being re-created.
#
# Terraform owns the secret; the value is set by hand (see README) and ignored on
# subsequent applies so a deploy never reverts it.

locals {
  is_prod = local.env.environment == "prod"
}

resource "aws_secretsmanager_secret" "indexer_rate_limit_bypass" {
  count = local.is_prod ? 1 : 0

  name        = "block-explorer/prod/indexer-rate-limit-bypass"
  description = "x-rate-limit-bypass token for server-side VeWorld indexer calls"

  tags = {
    Name = "block-explorer-indexer-rate-limit-bypass"
  }
}

resource "aws_secretsmanager_secret_version" "indexer_rate_limit_bypass" {
  count = local.is_prod ? 1 : 0

  secret_id = aws_secretsmanager_secret.indexer_rate_limit_bypass[0].id

  # App Runner needs a version to resolve on the first apply, before anyone has set the
  # real token. The app trims the value, so this blank placeholder reads as unset and no
  # bypass header is sent - rather than a bogus token the indexer would reject.
  secret_string = " "

  lifecycle {
    ignore_changes = [secret_string]
  }
}
