locals {
  env  = yamldecode(file("../environments/preview/preview.yaml"))
  name = "${var.project}-preview"

  # Previews live only in explorer-dev; cross-stack reads pin this rather than inherit it.
  dev_workspace = "dev"

  # No includeSubDomains: pr-N hosts sit under the preview apex.
  hsts_header_value = "max-age=31536000"
}
