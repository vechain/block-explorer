locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}"
}
