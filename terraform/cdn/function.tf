# The routing the Node server used to do, moved to the edge. The store is what makes one
# distribution serve dev and every preview: the deploy pins a host's bundle here, and the function
# reads it per request rather than the distribution being republished.

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

# Previews write their own keys from the preview workflow; these two are the environment's own.
resource "aws_cloudfrontkeyvaluestore_key" "host" {
  for_each = toset(local.record_names)

  key_value_store_arn = aws_cloudfront_key_value_store.routes.arn
  key                 = each.value
  value               = jsonencode({ bundle = local.bundle_prefix, config = terraform.workspace })
}
