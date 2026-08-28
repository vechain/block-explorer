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

variable "public_zone_names" {
  type        = list(string)
  description = "Public zones in this account the prod pipeline may write into. explore.vechain.org is the name users type; it still resolves to App Runner."
  default     = ["block-explorer.vechain.org", "explore.vechain.org"]
}

variable "prod_deploy_role_arn" {
  type        = string
  description = "The prod account's GitHub Actions deploy role, from bootstrap/'s gha_role_arn output. Passed as TF_VAR_prod_deploy_role_arn from a GitHub Environment variable rather than committed, because it carries an account id. Empty creates no role."
  default     = ""
}
