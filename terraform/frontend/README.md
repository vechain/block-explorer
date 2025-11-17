# Frontend Infrastructure

AWS App Runner deployment for Block Explorer using Terraform workspaces.

## Architecture

- **Service**: AWS App Runner (fully managed container service)
- **State Management**: Terraform workspaces (one per environment)
- **Deployment**: Automated via GitHub Actions
- **Custom Domains**: Configured with automatic DNS validation

## Workspaces

| Workspace | Purpose | Domain | State Location |
|-----------|---------|--------|----------------|
| `production` | Production environment | `block-explorer.vechain.org` | `s3://vechain-terraform-state-prod/env:/production/frontend/terraform.tfstate` |
| `preview-pr-{number}` | PR preview environments | `pr-{number}.block-explorer-preview.vechain.org` | `s3://vechain-terraform-state-nonprod/env:/preview-pr-{number}/frontend/terraform.tfstate` |

## Automated Deployment

### Production
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/deploy-production.yml`
- **Process**: 
  1. Build Docker image with tag `prod-{short_sha}`
  2. Push to ECR
  3. Update `prod.yaml` with new image tag
  4. Deploy via Terraform

### Preview Environments
- **Trigger**: PR opened/updated
- **Workflow**: `.github/workflows/deploy-preview.yml`
- **Process**:
  1. Post "Building" comment on PR
  2. Build Docker image with tag `pr-{number}-{short_sha}`
  3. Push to ECR
  4. Generate environment config from template
  5. Deploy via Terraform
  6. Update PR comment with deployment status and URLs
- **Cleanup**: Automatically destroyed when PR is closed (`.github/workflows/destroy-preview.yml`)
- **Concurrency**: Only latest commit per PR deploys (older builds are cancelled)

## Configuration

Environment configuration is stored in YAML files:

### Production
**File**: `terraform/environments/prod/prod.yaml`

```yaml
environment: prod
domain: block-explorer.vechain.org
image_tag: prod-abc1234  # Updated by CI/CD
cpu: 1024                 # 1 vCPU
memory: 2048              # 2 GB
min_size: 1               # Always 1 instance (no cold starts)
max_size: 10
```

### Preview
**Template**: `terraform/environments/preview/preview.yaml.example`
**Generated**: `terraform/environments/preview-pr-{number}/preview-pr-{number}.yaml`

```yaml
environment: preview-pr-123
domain: pr-123.block-explorer-preview.vechain.org
image_tag: pr-123-abc1234  # Set by CI/CD
cpu: 512                    # 0.5 vCPU (smaller for previews)
memory: 1024                # 1 GB
min_size: 1                 # App Runner requires ≥1
max_size: 2
```

## Resources Created

Per environment:
- **App Runner Service** - Runs the Next.js application
- **Auto-scaling Configuration** - Defines scaling limits
- **Custom Domain Association** - Links custom domain to service
- **Route53 Records** - DNS records (A record + validation CNAMEs)

## Manual Deployment

### Prerequisites
- Account-level infrastructure deployed
- Docker image pushed to ECR
- Environment config file created

### Deploy Production

```bash
cd terraform/frontend
terraform init -backend-config=../environments/production/backend.config
terraform workspace select production
terraform plan
terraform apply
```

### Deploy Preview

```bash
cd terraform/frontend
terraform init -backend-config=../environments/preview/backend.config

# Create workspace and config
terraform workspace new preview-pr-123
cp ../environments/preview/preview.yaml.example ../environments/preview-pr-123/preview-pr-123.yaml
# Edit the config file with PR number and image tag

terraform plan
terraform apply
```

### Destroy Preview

```bash
terraform workspace select preview-pr-123
terraform destroy
terraform workspace select default
terraform workspace delete preview-pr-123
rm -rf ../environments/preview-pr-123
```

## Custom Domain Setup

Custom domains are automatically configured:

1. **App Runner** creates custom domain association
2. **Terraform** queries validation records from App Runner
3. **Route53** records are created for DNS validation
4. **App Runner** verifies ownership (5-10 minutes)
5. **Domain** becomes active with HTTPS

## Outputs

After deployment:

| Output | Description | Example |
|--------|-------------|---------|
| `service_url` | Default App Runner URL | `https://xyz.awsapprunner.com` |
| `custom_domain_url` | Custom domain URL | `https://block-explorer.vechain.org` |
| `service_arn` | App Runner service ARN | For API operations |
| `custom_domain_status` | Domain validation status | `active` or `pending_certificate_dns_validation` |

## Cost Optimization

- **Preview Environments**: Minimum 1 instance (App Runner requirement), scales to 2 max
- **Auto-cleanup**: Preview environments destroyed when PR closes
- **Image Lifecycle**: Old preview images automatically deleted (keeps last 10)

## Troubleshooting

### Custom domain not activating
- Check validation records in Route53
- Wait 5-10 minutes after first deployment
- Verify ACM certificate status
- Use default App Runner URL in the meantime

### Terraform state locked
- Check for concurrent deployments (same PR)
- Concurrency control prevents multiple applies per PR
- If stuck, manually release lock via DynamoDB

### Health check failures
- App Runner health check: `GET /` on port 3000
- Ensure Next.js binds to `0.0.0.0` (set via `HOSTNAME` env var)
- Check App Runner logs in CloudWatch
