variable "aws_region" {
  type        = string
  description = "Region for the AWS provider (must match the backend region)."
  default     = "eu-west-1"
}

variable "project" {
  type        = string
  description = "Name prefix. Resources are named <project>-<workspace>-<role>."
  default     = "block-explorer"
}

variable "state_bucket" {
  type        = string
  description = "Terraform state bucket for this account, created by hand. The deploy role is granted s3 on this bucket and no other."
  default     = "vechain-block-explorer-terraform-state-prod"
}

variable "ecr_repository_name" {
  type        = string
  description = "Repository the prod pipeline promotes release images into. frontend/ reads it by this name."
  default     = "block-explorer"
}

variable "foreign_ecr_repository_names" {
  type        = list(string)
  description = "Repositories in this shared account belonging to other projects. Denied to the deploy role by name, since ECR actions do not evaluate resource tags."
  default     = ["vechain/explore", "vechain/mass", "vechain/chain-scanner"]
}

variable "foreign_state_bucket_names" {
  type        = list(string)
  description = "State buckets in this shared account belonging to other projects. Denied by name, since bucket-level actions do not surface bucket tags."
  default     = ["explore-terraform-state-prod"]
}
