variable "aws_region" {
  type        = string
  description = "Region for the AWS provider (must match the backend region)."
  default     = "eu-west-1"
}

variable "project" {
  type        = string
  description = "Name prefix. Resources here are named <project>-preview-pr-<pr_number>."
  default     = "block-explorer"
}

variable "state_bucket" {
  type        = string
  description = "Bucket holding the dev stacks' state. Same value as environments/preview/backend.config, passed separately because a backend block cannot be read from within the configuration."
  default     = "block-explorer-terraform-state-nonprod"
}

variable "ecr_repository_name" {
  type        = string
  description = "ECR repository holding the runtime image. Owned by the account-level stack."
  default     = "block-explorer"
}

variable "pr_number" {
  type        = number
  description = "GitHub PR number. Drives the hostname, the listener-rule priority and every resource name, so each PR is fully isolated."

  validation {
    # Priority is 2000 + pr_number and the ALB ceiling is 50000.
    condition     = var.pr_number >= 1 && var.pr_number <= 40000
    error_message = "pr_number must be between 1 and 40000 (ALB listener-rule priority ceiling)."
  }
}

variable "image_tag" {
  type        = string
  description = "Tag in the ECR repository, pr-<N>-app-<content sha>, promoted from the multi-arch GHCR PR image by deploy-preview.yml. An apply with a new value is what rolls the service, so a push that changes nothing the build reads is a no-op."
}

variable "app_version" {
  type        = string
  description = "Version string the footer shows, v.0.0.0-pr.<N>.<short sha>. Injected at runtime rather than baked in, so one image serves every PR and the release. Defaulted so a destroy need not pass it."
  default     = "dev"
}
