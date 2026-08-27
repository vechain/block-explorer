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

variable "okta_saml_metadata_url" {
  type        = string
  description = "IdP metadata URL of the Okta SAML application fronting Grafana sign-in. Empty leaves the workspace on SAML with no configuration applied: dashboards still provision through the service-account token, but nobody can log in until Okta provisions the app."
  default     = ""
}

variable "grafana_admin_okta_groups" {
  type        = list(string)
  description = "Values of the Okta SAML `role` attribute that map to the Grafana Admin role."
  default     = []
}

variable "grafana_editor_okta_groups" {
  type        = list(string)
  description = "Same as grafana_admin_okta_groups, for the Editor role."
  default     = []
}

variable "slack_webhook_url" {
  type        = string
  sensitive   = true
  description = "Slack incoming-webhook URL for alert delivery. Empty writes a `placeholder` sentinel and the bridge Lambda no-ops."
  default     = ""
}
