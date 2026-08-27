output "vpc_id" {
  description = "VPC ID. Consumed by edge/ for security groups and target groups, and by frontend/ for the service network configuration."
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR. Used to scope in-VPC security group egress."
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs (Network=Public). For the ALBs in edge/ and preview-edge/."
  value       = module.vpc.public_subnets
}

output "application_subnet_ids" {
  description = "Private subnet IDs with NAT egress (Tier=Application). Where ECS tasks run."
  value       = module.vpc.private_subnets
}

output "database_subnet_ids" {
  description = "Private subnet IDs with no internet egress (Tier=Database). For phase 4's ElastiCache subnet group."
  value       = module.vpc.database_subnets
}

output "nat_gateway_public_ips" {
  description = "Elastic IPs every server-side request egresses from. All indexer traffic collapses onto these, which is why INDEXER_RATE_LIMIT_BYPASS is needed here — allowlist them upstream if the token is ever withdrawn."
  value       = module.vpc.nat_public_ips
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
