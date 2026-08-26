locals {
  env  = yamldecode(file("../environments/${terraform.workspace}/${terraform.workspace}.yaml"))
  name = "${var.project}-${terraform.workspace}"

  az_count = local.env.az_count

  # Three /20 tiers laid out back to back, so the YAML only carries the /16.
  # Subnet CIDRs are immutable in AWS, and awsvpc gives every Fargate task its
  # own address, so /20 rather than /24.
  public_subnets   = [for i in range(local.az_count) : cidrsubnet(local.env.vpc_cidr, 4, i)]
  private_subnets  = [for i in range(local.az_count) : cidrsubnet(local.env.vpc_cidr, 4, local.az_count + i)]
  database_subnets = [for i in range(local.az_count) : cidrsubnet(local.env.vpc_cidr, 4, 2 * local.az_count + i)]
}
