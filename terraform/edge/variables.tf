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

variable "dns_role_arn" {
  type        = string
  description = "Role to assume for Route53, from the dns/ stack's dns_writer_role_arn output. Needed in prod, where the zone is in another account; empty in dev, where it is not. Passed as TF_VAR_dns_role_arn from a GitHub Environment variable rather than committed, because it carries an account id."
  default     = ""
}
