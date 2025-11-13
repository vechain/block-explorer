# Account-Level Infrastructure

This directory contains Terraform configuration for shared infrastructure that persists across all environments.

## Resources Created

- **ECR Repository**: Stores Docker images for all environments (production and previews)
- **IAM Roles**: 
  - Instance role for the App Runner service
  - Access role for pulling images from ECR
- **ACM Certificates**:
  - Production certificate for `block-explorer-prod.vechain.org`
  - Wildcard certificate for `*.block-explorer-preview.vechain.org`

## Prerequisites

1. S3 backend must be created first (see `../s3-backend/`)
2. Route53 hosted zone for `vechain.org` should exist

## Usage

### Initial Setup

```bash
cd terraform/account-level
terraform init
terraform plan
terraform apply
```

### Configuration

Update the following variables if needed:

- `route53_zone_id`: The hosted zone ID for vechain.org (required for DNS validation)
- `create_route53_records`: Set to `false` if managing DNS outside of Terraform

### Outputs

After applying, this module outputs:
- ECR repository URL (needed for building and pushing images)
- IAM role ARNs (needed by frontend infrastructure)
- Certificate ARNs (needed for custom domains in App Runner)

## Note

This infrastructure should be applied once and rarely changes. The state is stored in the production S3 bucket since these resources are shared across all environments.

