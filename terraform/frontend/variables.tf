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
  description = "Bucket holding the other stacks' state. Same value as environments/<env>/backend.config, passed separately because a backend block cannot be read from within the configuration."
  default     = "block-explorer-terraform-state-nonprod"
}

variable "ecr_repository_name" {
  type        = string
  description = "ECR repository holding the runtime image. Owned by the account-level stack."
  default     = "block-explorer"
}
