locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}"

  # Preload is sticky, so dev gets a bare one-year max-age and never asks for it.
  hsts_header_value = terraform.workspace == "prod" ? "max-age=63072000; includeSubDomains; preload" : "max-age=31536000"
}
