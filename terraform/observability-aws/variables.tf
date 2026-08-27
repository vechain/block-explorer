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

variable "slack_webhook_url" {
  type        = string
  sensitive   = true
  description = "Slack incoming-webhook URL for alert delivery. Empty writes a `placeholder` sentinel and the bridge Lambda no-ops."
  default     = ""
}
