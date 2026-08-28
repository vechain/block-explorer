# Public ingress for one environment: the ALB, the security groups the ECS
# tasks attach to, the target group they register into, and the DNS record.
#
# Until frontend/ exists the target group has no targets and the ALB answers
# 503. That is the expected state after a first apply.

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

data "terraform_remote_state" "acm" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket  = local.state_bucket
    key     = "acm/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# ---------------------------------------------------------------------------
# Security groups
# ---------------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${local.name}-sg-alb"
  description = "Public ingress for the ALB."
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  ingress {
    description      = "HTTP from the internet (redirected to HTTPS)."
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "HTTPS from the internet."
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description      = "All outbound. ALBs are AWS-managed and must reach targets on any port."
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-sg-app"
  description = "Explorer ECS task SG. Ingress from the ALB only; egress scoped to HTTPS out and VPC-internal."
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  ingress {
    description     = "Container port from the ALB."
    from_port       = local.env.container_port
    to_port         = local.env.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # No plain HTTP, DNS-UDP or arbitrary TCP: every upstream the explorer talks
  # to (Thor nodes, the indexer, b32, the coin API, ECR, AMP) is HTTPS.
  egress {
    description      = "HTTPS to the internet."
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description = "VPC-internal (the shared Valkey)."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [data.terraform_remote_state.network.outputs.vpc_cidr_block]
  }
}

# ---------------------------------------------------------------------------
# Load balancer
# ---------------------------------------------------------------------------

resource "aws_lb" "main" {
  name               = "${local.name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = data.terraform_remote_state.network.outputs.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]

  enable_deletion_protection = terraform.workspace == "prod"
  drop_invalid_header_fields = true
}

# Health check path is /api/health, not /: middleware.ts skips /api/*, so this
# is the only route that answers a bare 200 rather than a 307 to /en. The
# target group declares no matcher, which defaults to 200.
resource "aws_lb_target_group" "app" {
  name        = "${local.name}-tg"
  port        = local.env.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  deregistration_delay = 60
}

# ---------------------------------------------------------------------------
# Listeners
# ---------------------------------------------------------------------------

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # AWS stamps the banner on this listener's own 301s, so :443 alone is not enough.
  routing_http_response_server_enabled = false

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = data.terraform_remote_state.acm.outputs.certificate_arn

  routing_http_response_strict_transport_security_header_value = local.hsts_header_value

  # Drops the `Server: awselb/2.0` banner, which otherwise fingerprints the LB.
  routing_http_response_server_enabled = false

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# The listener's own certificate_arn is the default one; a second name has to be
# added here, or the ALB answers it with a mismatched cert.
resource "aws_lb_listener_certificate" "extra" {
  count = local.extra_domain == null ? 0 : 1

  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = data.terraform_remote_state.acm.outputs.extra_certificate_arn
}

# Scraped in-task over loopback, so it never needs to cross the ALB. Priority 10
# keeps the block under any future auth gate, covering authenticated users too.
resource "aws_lb_listener_rule" "block_metrics" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden: /api/metrics is not reachable on the public ALB. Metrics are scraped in-task."
      status_code  = "403"
    }
  }

  condition {
    path_pattern {
      values = ["/api/metrics", "/api/metrics/*"]
    }
  }
}

resource "aws_route53_record" "app" {
  count    = local.env.dns_record_enabled ? 1 : 0
  provider = aws.dns

  zone_id = data.terraform_remote_state.acm.outputs.public_zone_id
  name    = local.env.domain
  type    = "A"

  # Route53 rejects a weighted record beside a simple one of the same name.
  set_identifier = local.dns_weight == null ? null : "ecs-${terraform.workspace}"

  dynamic "weighted_routing_policy" {
    for_each = local.dns_weight == null ? [] : [local.dns_weight]

    content {
      weight = weighted_routing_policy.value
    }
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# The dev record predates the count, so without this Terraform destroys and
# recreates it.
moved {
  from = aws_route53_record.app
  to   = aws_route53_record.app[0]
}

# Sole record on the name since App Runner went. See README.
resource "aws_route53_record" "extra_app" {
  for_each = local.extra_weighted
  provider = aws.dns

  zone_id = data.terraform_remote_state.acm.outputs.extra_public_zone_id
  name    = each.value
  type    = "A"

  set_identifier  = "ecs-${terraform.workspace}"
  allow_overwrite = true

  weighted_routing_policy {
    weight = local.extra_dns_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
