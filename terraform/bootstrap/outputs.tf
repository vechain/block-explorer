output "gha_role_arn" {
  description = "Deploy role for this repo's pipeline in this account. Set it as AWS_OIDC_ROLE_ARN on the matching GitHub Environment."
  value       = aws_iam_role.gha.arn
}

output "ecr_repository_url" {
  description = "Registry the pipeline promotes images into. Null in dev, which has none."
  value       = local.ecr_repository_url
}

output "ecr_repository_name" {
  description = "Repository name. Null in dev, which has none."
  value       = local.account.create_ecr ? var.ecr_repository_name : null
}

output "state_bucket" {
  description = "State bucket this account's stacks write to. Created by hand — see README.md."
  value       = local.state_bucket
}

output "terraform_workspace" {
  description = "Current Terraform workspace. Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
