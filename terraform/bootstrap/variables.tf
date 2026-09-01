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

variable "ecr_repository_name" {
  type        = string
  description = "Repository the pipeline promotes images into. Created here in prod, looked up in dev where account-level/ owns it. frontend/ reads it by this name."
  default     = "block-explorer"
}

variable "foreign_ecr_repository_names" {
  type        = list(string)
  description = "Repositories belonging to other projects, present in both shared accounts. Denied to the deploy role by name, since ECR actions do not evaluate resource tags."
  default     = ["vechain/explore", "vechain/mass", "vechain/chain-scanner"]
}
