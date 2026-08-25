################################################################################
# Indexer Rate Limit Bypass
################################################################################

# Prod only: preview traffic stays under the limit, and Secrets Manager's deletion
# recovery window collides with previews being re-created.

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

  # Placeholder so App Runner has a version to resolve before the token is set by hand.
  secret_string = " "

  lifecycle {
    ignore_changes = [secret_string]
  }
}
