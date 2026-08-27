output "dns_writer_role_arn" {
  description = "Role the prod pipeline assumes for Route53 writes. Set it as DNS_WRITER_ROLE_ARN on the prod GitHub Environment. Null until prod_deploy_role_arn is supplied."
  value       = one(aws_iam_role.dns_writer[*].arn)
}

output "public_zone_ids" {
  description = "Zone ids the role can write to, by zone name."
  value       = { for name, zone in data.aws_route53_zone.public : name => zone.zone_id }
}

output "terraform_workspace" {
  description = "Current Terraform workspace. Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
