# Ingress shared by every PR preview. The wildcard record moved to cdn/ when the previews did.
#
# A second ALB rather than dev's own, so a preview cannot spend dev's WAF rate
# limit or show up in dev's ALB metrics. Concurrent previews cap at 100 — the
# target-group-per-ALB quota, which AWS does not raise.

data "terraform_remote_state" "network" {
  backend   = "s3"
  workspace = local.dev_workspace

  config = {
    bucket  = var.state_bucket
    key     = "network/terraform.tfstate"
    region  = var.aws_region
    encrypt = true
  }
}

# Owned by account-level/ and looked up rather than read from its state: that stack is legacy.
data "aws_acm_certificate" "wildcard" {
  domain      = "*.${local.env.domain_suffix}"
  statuses    = ["ISSUED"]
  most_recent = true
}

# ---------------------------------------------------------------------------
# Security groups
# ---------------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${local.name}-sg-alb"
  description = "Public ingress for the shared preview ALB."
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

# Shared by every preview task. Per-PR isolation comes from the host-header
# rule, not from the network: previews are all equally untrusted.
resource "aws_security_group" "app" {
  name        = "${local.name}-sg-app"
  description = "Preview ECS task SG. Ingress from the preview ALB only; egress scoped to HTTPS out and VPC-internal."
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  ingress {
    description     = "Container port from the preview ALB."
    from_port       = local.env.container_port
    to_port         = local.env.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

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

resource "aws_lb" "preview" {
  name               = "${local.name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = data.terraform_remote_state.network.outputs.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]

  drop_invalid_header_fields = true
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.preview.arn
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

# The default action answers hosts no PR has claimed.
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.preview.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = data.aws_acm_certificate.wildcard.arn

  routing_http_response_strict_transport_security_header_value = local.hsts_header_value
  routing_http_response_server_enabled                         = false

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "No preview is deployed for this host. Add the create-preview label to the pull request."
      status_code  = "404"
    }
  }
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == local.dev_workspace
      error_message = "Previews exist only in explorer-dev. Use workspace 'dev'. Example: terraform workspace select -or-create dev"
    }
  }
}
