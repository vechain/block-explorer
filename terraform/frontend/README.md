# Frontend Infrastructure

This directory contains Terraform configuration for deploying the block-explorer frontend using AWS App Runner.

## Workspace Strategy

This configuration uses Terraform workspaces to manage multiple environments:

- `production` - Production environment
- `preview-pr-{number}` - Ephemeral preview environments for pull requests

## Prerequisites

1. S3 backend must exist (see `../s3-backend/`)
2. Account-level infrastructure must be deployed (see `../account-level/`)
3. Environment configuration file must exist for the workspace

## Usage

### Deploy Production

```bash
cd terraform/frontend

# Initialize with production backend
terraform init -backend-config=../environments/production/backend.config

# Select production workspace (or create if first time)
terraform workspace select production || terraform workspace new production

# Plan and apply
terraform plan
terraform apply
```

### Deploy Preview Environment

```bash
cd terraform/frontend

# Initialize with non-prod backend
terraform init -backend-config=../environments/preview/backend.config

# Create workspace for this PR
terraform workspace new preview-pr-123

# Create environment config file
# (usually done by GitHub Actions)
# See ../environments/preview/preview.yaml.example

# Plan and apply
terraform plan
terraform apply
```

### Destroy Preview Environment

```bash
# Select the preview workspace
terraform workspace select preview-pr-123

# Destroy all resources
terraform destroy

# Switch back to default and delete workspace
terraform workspace select default
terraform workspace delete preview-pr-123
```

## Configuration

Environment-specific configuration is stored in YAML files under `../environments/{workspace}/`.

Required configuration fields:
- `environment` - Environment name
- `domain` - Custom domain name
- `image_tag` - Docker image tag to deploy
- `cpu` - CPU units (256, 512, 1024, 2048, 4096)
- `memory` - Memory in MB (512-12288, must be compatible with CPU)
- `port` - Container port (typically 3000 for Next.js)
- `min_size` - Minimum number of instances (0 for preview, 1 for prod)
- `max_size` - Maximum number of instances
- `max_concurrency` - Max concurrent requests per instance

## Outputs

After deployment, the configuration outputs:
- Service URL (default App Runner URL)
- Custom domain URL (if configured)
- Service ARN and ID
- Current service status

