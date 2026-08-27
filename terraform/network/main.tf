# VPC for the block explorer. Deliberately not the Control Tower Account
# Factory VPC that ships with the account: that one is owned by a StackSet in
# the management account, so its CIDR and routing are not ours to change and
# reusing it would leave the network layer outside this repo's Terraform.

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "${local.name}-vpc"
  cidr = local.env.vpc_cidr

  # Two is the floor: the ALB and the cache subnet group each require it.
  azs = slice(data.aws_availability_zones.available.names, 0, local.az_count)

  public_subnets   = local.public_subnets
  private_subnets  = local.private_subnets
  database_subnets = local.database_subnets

  # Tags follow the vechain platform convention, so shared modules can find
  # these subnets by `data "aws_subnets"` filter rather than by id.
  public_subnet_tags   = { Network = "Public" }
  private_subnet_tags  = { Network = "Private", Tier = "Application" }
  database_subnet_tags = { Network = "Private", Tier = "Database" }

  # No 0.0.0.0/0 route here at all: the Valkey in data/ reaches nothing outside.
  create_database_subnet_route_table = true

  # Nothing here uses RDS, and the Valkey takes subnet ids directly.
  create_database_subnet_group = false

  enable_nat_gateway      = true
  single_nat_gateway      = local.env.single_nat_gateway
  enable_dns_hostnames    = true
  enable_dns_support      = true
  map_public_ip_on_launch = false
}

# ECR serves image layers out of S3, so this free gateway endpoint keeps every
# task pull off the NAT gateway's per-GB charge.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.database_route_table_ids)

  tags = { Name = "${local.name}-s3" }
}

# The `module "vpc"` call takes no lifecycle block, so the guard hangs off a
# throwaway resource — plan fails before any VPC API call.
resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Use workspace 'dev' or 'prod' (not default). Example: terraform workspace select -or-create dev"
    }
  }
}
