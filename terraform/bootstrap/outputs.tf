output "gha_role_arn" {
  description = "Deploy role for this repo's prod pipeline. Set it as AWS_OIDC_ROLE_ARN on the prod GitHub Environment."
  value       = aws_iam_role.gha.arn
}

output "ecr_repository_url" {
  description = "Registry the pipeline promotes release images into."
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "Repository name, which is what frontend/ looks the registry up by."
  value       = aws_ecr_repository.app.name
}

output "state_bucket" {
  description = "State bucket this account's stacks write to. Created by hand — see README.md."
  value       = var.state_bucket
}

output "terraform_workspace" {
  description = "Current Terraform workspace. Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
