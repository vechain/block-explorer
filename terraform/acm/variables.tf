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

variable "public_zone_name" {
  type        = string
  description = "Route53 public zone the validation record goes into. Both zones live in explorer-dev, which is what makes the phase 6 weighted cutover possible."
  default     = "block-explorer.vechain.org"
}

variable "validation_timeout" {
  type        = string
  description = "How long to wait for ACM to mark the cert ISSUED. In-account DNS, so this is normally a couple of minutes."
  default     = "15m"
}
