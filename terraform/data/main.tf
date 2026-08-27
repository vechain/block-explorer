# The shared cache behind /api/*: one ElastiCache Serverless Valkey, reached by
# the environment's own tasks and — in dev — by every PR preview as well.
#
# Apply order on a fresh environment:
#   network -> ecs -> acm -> edge -> preview-edge -> data -> observability-aws -> frontend
#
# What makes it worth sharing is the day-long half of the cache — decoded selectors
# and Sourcify ABIs. See terraform/README.md.

data "terraform_remote_state" "network" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "network/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "edge" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

data "terraform_remote_state" "preview_edge" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "preview-edge/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# No egress rules at all: a cache initiates nothing. Its subnets have no route
# off the VPC either, so this is the second of two independent bounds.
resource "aws_security_group" "cache" {
  name        = "${local.name}-sg-cache"
  description = "Valkey ingress from the explorer tasks. No egress."
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id
}

# One rule per client rather than an inline block, so a workspace without
# previews simply has one fewer rule instead of a different security group.
resource "aws_vpc_security_group_ingress_rule" "cache" {
  for_each = local.client_security_group_ids

  security_group_id            = aws_security_group.cache.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = 6379
  to_port                      = 6380
  description                  = "Valkey from the ${each.key} tasks. 6380 is the reader endpoint, which cluster discovery can hand back."
}

# Alphanumeric, so the values need no escaping inside the rediss:// URLs below.
resource "random_password" "cache_app" {
  length  = 64
  special = false
}

resource "random_password" "cache_preview" {
  length  = 64
  special = false
}

# A user group must contain `default`, and Valkey no longer honours
# no-password-required — so it gets a password nothing ever reads, on top of an
# access string that refuses every command.
resource "random_password" "cache_default_unused" {
  length  = 64
  special = false
}

resource "aws_elasticache_user" "default" {
  user_id       = "${local.name}-default"
  user_name     = "default"
  engine        = "valkey"
  access_string = "off -@all"

  authentication_mode {
    type      = "password"
    passwords = [random_password.cache_default_unused.result]
  }
}

# The keyspace is one flat namespace of proxy responses, so `~*` is the whole of
# it. -@dangerous drops FLUSHALL, CONFIG and friends: nothing in the app calls
# them, and a cache that can be flushed from the app is a stampede waiting to be
# triggered.
resource "aws_elasticache_user" "app" {
  user_id       = "${local.name}-app"
  user_name     = "${local.name}-app"
  engine        = "valkey"
  access_string = "on ~* +@all -@dangerous"

  authentication_mode {
    type      = "password"
    passwords = [random_password.cache_app.result]
  }
}

# Previews run unmerged code against the instance dev uses, so the key namespace
# cannot be the only fence — it is app-level, and preview code is what would have
# to honour it. `~pr-*` matches every preview's image tag and nothing dev writes.
resource "aws_elasticache_user" "preview" {
  user_id       = "${local.name}-preview"
  user_name     = "${local.name}-preview"
  engine        = "valkey"
  access_string = "on ~pr-* +@all -@dangerous"

  authentication_mode {
    type      = "password"
    passwords = [random_password.cache_preview.result]
  }
}

resource "aws_elasticache_user_group" "this" {
  user_group_id = "${local.name}-cache-users"
  engine        = "valkey"

  user_ids = [
    aws_elasticache_user.default.user_id,
    aws_elasticache_user.app.user_id,
    aws_elasticache_user.preview.user_id,
  ]
}

# Serverless, and TLS-only by definition. Both usage limits are ceilings against
# a runaway rather than a capacity plan: storage is billed per GB-hour and
# commands per ECPU, so an unbounded cache is an unbounded bill.
resource "aws_elasticache_serverless_cache" "valkey" {
  name                 = "${local.name}-cache"
  engine               = "valkey"
  major_engine_version = "8"
  description          = "Shared response cache for the ${terraform.workspace} explorer tasks and previews"

  cache_usage_limits {
    data_storage {
      maximum = local.env.cache_data_storage_max_gb
      unit    = "GB"
    }

    ecpu_per_second {
      maximum = local.env.cache_ecpu_per_second_max
    }
  }

  subnet_ids         = data.terraform_remote_state.network.outputs.database_subnet_ids
  security_group_ids = [aws_security_group.cache.id]
  user_group_id      = aws_elasticache_user_group.this.user_group_id
}

# Named with dashes rather than under `block-explorer/<env>/`: the App Runner
# instance role can still read that whole prefix, and this one carries a password.
resource "aws_secretsmanager_secret" "redis_url" {
  name        = "${local.name}-redis-url"
  description = "rediss:// URL for the Valkey app user. Injected into the tasks as REDIS_URL."
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id     = aws_secretsmanager_secret.redis_url.id
  secret_string = "rediss://${aws_elasticache_user.app.user_name}:${random_password.cache_app.result}@${local.cache_endpoint.address}:${local.cache_endpoint.port}"
}

resource "aws_secretsmanager_secret" "preview_redis_url" {
  name        = "${local.name}-redis-url-preview"
  description = "rediss:// URL for the Valkey preview user, which can only reach pr-* keys. Injected into the preview tasks as REDIS_URL."
}

resource "aws_secretsmanager_secret_version" "preview_redis_url" {
  secret_id     = aws_secretsmanager_secret.preview_redis_url.id
  secret_string = "rediss://${aws_elasticache_user.preview.user_name}:${random_password.cache_preview.result}@${local.cache_endpoint.address}:${local.cache_endpoint.port}"
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
