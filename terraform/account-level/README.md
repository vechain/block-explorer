# Account-Level Infrastructure

Shared infrastructure for Block Explorer that persists across all environments.

## Resources

### ECR Repository
- **Name**: `block-explorer`
- **Purpose**: Stores Docker images for all environments
- **Lifecycle Policy**: 
  - Keeps last 30 production images (`prod-*`)
  - Keeps last 10 preview images (`pr-*`)
  - Removes untagged images after 1 day

### IAM Roles
- **Instance Role**: Grants the App Runner container permissions (CloudWatch Logs)
- **Access Role**: Allows App Runner to pull images from ECR

### Route53 Hosted Zones
- **Production**: `block-explorer.vechain.org`
- **Preview**: `block-explorer-preview.vechain.org`

### ACM Certificates
- **Production**: `block-explorer.vechain.org` (DNS validated)
- **Preview**: `*.block-explorer-preview.vechain.org` (wildcard, DNS validated)

## Deployment

### First-Time Setup

```bash
cd terraform/account-level
terraform init
terraform plan
terraform apply
```

### State Storage

State is stored in S3 at `s3://vechain-terraform-state-prod/account-level/terraform.tfstate`

## Outputs

The following outputs are consumed by frontend infrastructure:

| Output | Description |
|--------|-------------|
| `ecr_repository_url` | ECR repository URL for image pushes |
| `block_explorer_public_zone_prod_id` | Route53 zone ID for production |
| `block_explorer_public_zone_preview_id` | Route53 zone ID for previews |
| `app_runner_instance_role_arn` | IAM role for App Runner instances |
| `app_runner_access_role_arn` | IAM role for ECR access |
| `prod_certificate_arn` | SSL certificate for production |
| `preview_certificate_arn` | Wildcard SSL certificate for previews |

## Notes

- This infrastructure is deployed **once** and rarely changes
- All environments share these resources
- Changes require manual deployment (not automated via CI/CD)
