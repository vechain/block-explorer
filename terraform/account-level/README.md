# Account-Level Infrastructure

What is left of the App Runner setup in `explorer-dev` after the move to ECS. Applied by hand, and
rarely.

## Resources

### ECR Repository

- **Name**: `block-explorer`
- **Purpose**: Stores Docker images for all environments
- **Lifecycle Policy**:
  - Keeps last 30 production images (`v.*`)
  - Keeps last 10 preview images (`pr-*`)
  - Removes untagged images after 1 day

### Route53 Hosted Zones

Both public zones live here, in the dev account, which is what lets a record for prod and a record for
dev sit in one zone — and is what made the weighted cutover possible. `cdn/` writes into them from
the prod account through the role `dns/` owns.

- **Production**: `block-explorer.vechain.org`
- **Preview**: `block-explorer-preview.vechain.org`

### ACM Certificates

Only the wildcard is left, and nothing reads it: `cdn/` issues its own certificate in us-east-1,
covering every alias the distribution answers on, previews included. The prod certificate went with
App Runner.

- **Preview**: `*.block-explorer-preview.vechain.org` (wildcard, DNS validated)

## Deployment

```bash
cd terraform/account-level
terraform init
terraform plan
terraform apply
```

State is stored in S3 at `s3://vechain-terraform-state-prod/account-level/terraform.tfstate`.

## Outputs

Nothing reads these through `terraform_remote_state` any more — `app-runner/` was the only consumer,
and the stacks that need a zone or a certificate look it up by name instead.

| Output                                  | Description                           |
| --------------------------------------- | ------------------------------------- |
| `ecr_repository_url`                    | ECR repository URL for image pushes   |
| `ecr_repository_arn`                    | ECR repository ARN                    |
| `block_explorer_public_zone_prod_id`    | Route53 zone ID for production        |
| `block_explorer_public_zone_preview_id` | Route53 zone ID for previews          |
| `prod_certificate_arn`                  | SSL certificate for production        |
| `preview_certificate_arn`               | Wildcard SSL certificate for previews |
