# The routing the Node server used to do, moved to the edge. The store is what makes one
# distribution serve dev and every preview: a host's bundle is read per request rather than the
# distribution being republished.

resource "aws_cloudfront_key_value_store" "routes" {
  name    = "${local.name}-routes"
  comment = "host -> {bundle, config} for the ${terraform.workspace} distribution"
}

resource "aws_cloudfront_function" "router" {
  name                         = "${local.name}-router"
  runtime                      = "cloudfront-js-2.0"
  code                         = file("${path.module}/edge-router.js")
  key_value_store_associations = [aws_cloudfront_key_value_store.routes.arn]
  publish                      = true
}

# Seeded here and moved by the deploy, so `bundle_prefix` in the env YAML is only a first apply.
resource "aws_cloudfrontkeyvaluestore_key" "host" {
  # Keys static, values apply-time: the distribution has no domain name on a first apply.
  for_each = merge(
    { for name in local.record_names : name => name },
    { distribution = aws_cloudfront_distribution.main.domain_name },
  )

  key_value_store_arn = aws_cloudfront_key_value_store.routes.arn
  key                 = each.value
  value               = jsonencode({ bundle = local.bundle_prefix, config = terraform.workspace })

  lifecycle {
    ignore_changes = [value]
  }
}
