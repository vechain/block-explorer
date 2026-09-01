variable "aws_region" {
  type        = string
  description = "Region for the AWS provider (must match the backend region). CloudFront itself is global; the us_east_1 alias covers what has to live there."
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

variable "public_zone_name" {
  type        = string
  description = "Route53 public zone holding this environment's own name. Both zones live in explorer-dev, which is what lets prod's records be written from the prod pipeline through dns_role_arn."
  default     = "block-explorer.vechain.org"
}

variable "dns_role_arn" {
  type        = string
  description = "Role to assume for Route53, from the dns/ stack's dns_writer_role_arn output. Needed in prod, where the zones are in another account; empty in dev. Passed as TF_VAR_dns_role_arn from a GitHub Environment variable rather than committed, because it carries an account id."
  default     = ""
}

variable "validation_timeout" {
  type        = string
  description = "How long to wait for ACM to mark the certificate ISSUED. In-account DNS, so this is normally a couple of minutes."
  default     = "15m"
}
