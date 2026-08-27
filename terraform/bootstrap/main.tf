# Prod only. dev's registry and its GitHub Actions role predate this layout and
# are still owned by account-level/ and by whoever administers the shared role,
# so applying this stack into the dev workspace would collide with both.
resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = terraform.workspace == "prod"
      error_message = "bootstrap/ is applied in the prod workspace only. Example: terraform workspace select -or-create prod"
    }
  }
}
