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
  description = "Override for the bucket holding the other stacks' state. Defaults to the one environments/<env>/backend.config declares, which is where this stack's own state goes."
  default     = null
}

variable "slack_webhook_url" {
  type        = string
  sensitive   = true
  description = "Slack incoming-webhook URL for alert delivery. Empty writes a `placeholder` sentinel and the bridge Lambda no-ops."
  default     = ""
}
