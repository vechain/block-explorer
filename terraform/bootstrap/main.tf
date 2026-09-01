# One workspace per account. See README.md.
resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(keys(local.accounts), terraform.workspace)
      error_message = "bootstrap/ is applied in the prod or dev workspace only. Example: terraform workspace select -or-create dev"
    }
  }
}
