output "cluster_arn" {
  description = "ECS cluster ARN. Consumed by frontend/ and, from phase 3, frontend-preview/."
  value       = aws_ecs_cluster.this.arn
}

output "cluster_name" {
  description = "ECS cluster name. What `aws ecs update-service --cluster` takes in the deploy workflow."
  value       = aws_ecs_cluster.this.name
}

output "terraform_workspace" {
  description = "Current Terraform workspace (dev or prod). Mirrored for cross-stack consistency."
  value       = terraform.workspace
}
