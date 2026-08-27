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

variable "adot_image_tag" {
  type        = string
  description = "aws-otel-collector image tag. Pinned, not `latest`, so a rollout is deterministic."
  default     = "v0.46.0"
}

variable "yace_image_tag" {
  type        = string
  description = "Yet Another CloudWatch Exporter image tag."
  default     = "v0.65.0"
}
