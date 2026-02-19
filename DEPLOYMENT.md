# Block Explorer Deployment Guide

This document provides a comprehensive guide for deploying the Block Explorer application using AWS App Runner and Terraform.

## Architecture Overview

The infrastructure consists of:

- **Production Environment**: Single permanent App Runner service at `block-explorer.vechain.org`
- **Preview Environments**: Ephemeral services at `pr-{number}.block-explorer-preview.vechain.org`
- **Terraform Workspaces**: Separate workspace for production and each preview
- **State Management**: S3 buckets with DynamoDB locking
- **Shared Auto Scaling**: Account-level auto scaling configurations (avoids AWS quota limits)

## Prerequisites

1. **AWS Account** with permissions for:
   - ECR (Elastic Container Registry)
   - App Runner
   - Route53
   - ACM (Certificate Manager)
   - S3
   - DynamoDB
   - IAM

2. **Tools Required**:
   - AWS CLI configured
   - Terraform >= 1.6.0
   - Docker
   - Node.js 20.17.0 (for local development)
   - pnpm 9.x

3. **GitHub Repository Secrets**:
   - `AWS_ACC_ROLE` - IAM role ARN with OIDC trust for GitHub Actions
   - `VECHAINCI_SSH_PRIVATE_KEYS` - Deploy key for semantic versioning

## Versioning Strategy

### Automated Semantic Versioning

This project uses **automated semantic versioning** via GitHub Actions. Version numbers are managed entirely through git tags and are **never stored in `package.json`**.

**How it works:**

1. When you open a PR, you must add one of these labels:
   - `increment:major` - Breaking changes (1.x.x → 2.0.0)
   - `increment:minor` - New features (1.1.x → 1.2.0)
   - `increment:patch` - Bug fixes (1.1.1 → 1.1.2)

2. The `validate-version-label.yml` workflow ensures every PR has a valid label

3. When a PR is merged to `main`, the `codebase-versioning.yml` workflow:
   - Reads the PR label
   - Calculates the next version number
   - Creates and pushes a new git tag (e.g., `v.1.2.3`)

4. The version is injected at build time via the `NEXT_PUBLIC_APP_VERSION` environment variable

**Note:** The `package.json` version is set to `0.0.0-dev` and is **not used** for versioning. The real version comes from git tags.

### Version Display

The application version displayed in the UI is:

- **Production/Preview**: The git tag or image tag passed at build time (e.g., `v.1.2.3`, or `pr-175-718a160`)
- **Local Development**: Falls back to `package.json` version (`0.0.0-dev`)

## Initial Infrastructure Setup

### Step 1: Deploy Account-Level Infrastructure

```bash
cd terraform/account-level
terraform init --backend-config="../environments/<env-name>"
terraform apply
```

**Created Resources**:

- ECR repository for Docker images
- IAM roles for App Runner
- ACM certificates (production + wildcard for previews)
- Route53 hosted zone configuration
- Shared auto scaling configurations (production + preview)

**Important**: Save the outputs from this step:

```bash
terraform output
```

## Production Deployment

### Automated (Recommended)

Production deployments are triggered manually via workflow dispatch from a version tag:

1. **Ensure your changes are merged to `main`** with the appropriate version label
2. **Wait for the version tag** to be created automatically (e.g., `v.1.5.0`)
3. **Go to Actions → Deploy to Production → Run workflow**
4. **Select the version tag** from the "Use workflow from" dropdown
5. **Choose action**:
   - `dry-run` - Preview changes without deploying
   - `deploy` - Apply changes to production
6. **Monitor deployment** progress in the workflow logs

The workflow will:

1. Validate the version tag format (`v.X.Y.Z`)
2. Build Docker image with the version tag
3. Push to ECR with tag `v.X.Y.Z`
4. Update production config
5. Deploy via Terraform
6. Push the image to GHCR (`ghcr.io/vechain/block-explorer`) with the version tag and `latest`
7. Create a GitHub Release (if new version)

### Manual Deployment (Not Recommended)

```bash
# 1. Get AWS ECR credentials
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

# 2. Build and push image (use the version tag)
VERSION_TAG="v.1.5.0"
docker build -t block-explorer --build-arg NEXT_PUBLIC_APP_VERSION=${VERSION_TAG} .
docker tag block-explorer:latest <ECR_URL>/block-explorer:${VERSION_TAG}
docker push <ECR_URL>/block-explorer:${VERSION_TAG}

# 3. Update config
cd terraform/environments/prod
sed -i "s/^image_tag:.*/image_tag: ${VERSION_TAG}/" prod.yaml

# 4. Deploy
cd ../../frontend
terraform init -backend-config=../environments/prod/backend.config
terraform workspace select prod
terraform plan
terraform apply
```

## Preview Environment Deployment

### Automated (Recommended)

Preview environments are automatically created when you:

1. Open a pull request to `main`
2. Push new commits to an existing PR

The preview URL will be posted as a comment on the PR.

**Image Tag Format**: `pr-{number}-{short_sha}` (e.g., `pr-144-a1b2c3d`)

**Domain**: `https://pr-{number}.block-explorer-preview.vechain.org`

### Manual Preview Deployment (Not Recommended)

```bash
PR_NUMBER=123
SHORT_SHA=$(git rev-parse --short HEAD)

# 1. Build and push image
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

IMAGE_TAG="pr-${PR_NUMBER}-${SHORT_SHA}"
docker build -t block-explorer --build-arg NEXT_PUBLIC_APP_VERSION=${IMAGE_TAG} .
docker tag block-explorer:latest <ECR_URL>/block-explorer:${IMAGE_TAG}
docker push <ECR_URL>/block-explorer:${IMAGE_TAG}

# 2. Create config
mkdir -p terraform/environments/preview-pr-${PR_NUMBER}
cp terraform/environments/preview/preview.yaml.example \
   terraform/environments/preview-pr-${PR_NUMBER}/preview-pr-${PR_NUMBER}.yaml

# Edit the file and replace {PR_NUMBER} with actual number
sed -i "s/{PR_NUMBER}/${PR_NUMBER}/g" \
  terraform/environments/preview-pr-${PR_NUMBER}/preview-pr-${PR_NUMBER}.yaml

# 3. Deploy
cd terraform/frontend
terraform init -backend-config=../environments/preview/backend.config
terraform workspace new preview-pr-${PR_NUMBER}
terraform apply

# 4. Get URL
terraform output custom_domain_url
```

## Destroying Preview Environments

### Automated

Preview environments are automatically destroyed when:

- The pull request is closed
- The pull request is merged

### Manual Destruction

```bash
PR_NUMBER=123

cd terraform/frontend
terraform init -backend-config=../environments/preview/backend.config
terraform workspace select preview-pr-${PR_NUMBER}
terraform destroy -auto-approve

# Cleanup
terraform workspace select default
terraform workspace delete preview-pr-${PR_NUMBER}
rm -rf ../environments/preview-pr-${PR_NUMBER}
```

## Environment Configuration

### Production Config

File: `terraform/environments/prod/prod.yaml`

Key settings:

- `cpu: 512` / `memory: 1024` - 0.5 vCPU, 1 GB RAM
- `port: 3000` - Application port
- `health_check_path: /` - Health check endpoint

### Preview Config

File: `terraform/environments/preview/preview.yaml.example`

Key settings:

- `cpu: 256` / `memory: 512` - 0.25 vCPU, 0.5 GB RAM (smaller than prod)
- `port: 3000` - Application port
- `health_check_path: /` - Health check endpoint

### Auto Scaling Configuration

Auto scaling is managed at the **account level** (`terraform/account-level/autoscaling.tf`), not per-environment. This is required because [AWS limits accounts to 10 unique auto scaling configuration names](https://docs.aws.amazon.com/apprunner/latest/dg/manage-autoscaling.html).

| Config                   | Min Size | Max Size | Max Concurrency |
| ------------------------ | -------- | -------- | --------------- |
| `block-explorer-prod`    | 1        | 10       | 100             |
| `block-explorer-preview` | 1        | 2        | 100             |

All preview environments share the same `block-explorer-preview` auto scaling configuration.

**To modify auto scaling settings:**

```bash
cd terraform/account-level
# Edit autoscaling.tf
terraform plan
terraform apply
```

## Monitoring

### CloudWatch Logs

View logs for production:

```bash
aws logs tail /aws/apprunner/prod-block-explorer/*/application --follow
```

View logs for preview:

```bash
PR_NUMBER=123
aws logs tail /aws/apprunner/preview-pr-${PR_NUMBER}-block-explorer/*/application --follow
```

### Service Status

Check App Runner service status:

```bash
aws apprunner list-services --region eu-west-1
```

Get service details:

```bash
aws apprunner describe-service --service-arn <SERVICE_ARN>
```

## Troubleshooting

### Build Failures

**Issue**: Docker build fails in GitHub Actions

**Solution**:

1. Check the workflow logs in GitHub Actions
2. Test build locally: `docker build -t block-explorer .`
3. Verify `next.config.ts` has `output: 'standalone'`
4. Check pnpm-lock.yaml is compatible with pnpm 9.15.4

### Service Won't Start

**Issue**: App Runner service fails to start

**Solutions**:

1. Check CloudWatch Logs for errors
2. Verify the Docker image starts locally:
   ```bash
   docker run -p 3000:3000 <ECR_URL>/block-explorer:pr-123
   ```
3. Check health check endpoint returns 200 OK

### Custom Domain Not Working

**Issue**: Custom domain shows certificate errors

**Solutions**:

1. Verify certificate is validated in ACM console
2. Check DNS records in Route53
3. Wait for DNS propagation (up to 48 hours)
4. Verify custom domain association status:
   ```bash
   aws apprunner list-custom-domains --service-arn <SERVICE_ARN>
   ```

### Workspace Conflicts

**Issue**: Cannot switch workspaces or workspace doesn't exist

**Solutions**:

1. List workspaces: `terraform workspace list`
2. Create if missing: `terraform workspace new <name>`
3. Ensure correct backend config: `-backend-config=../environments/<env>/backend.config`

### Version Label Missing

**Issue**: PR checks fail with "missing version label"

**Solution**:

1. Add one of the required labels to your PR:
   - `increment:patch` - for bug fixes
   - `increment:minor` - for new features
   - `increment:major` - for breaking changes
2. Re-run the check

## Cost Breakdown

**Important Note**: AWS App Runner requires a minimum of 1 instance (`min_size: 1`). It doesn't support scaling to zero. However, you only pay for provisioned memory when idle (not CPU), making costs very low for inactive preview environments.

### Production (Monthly)

- App Runner: ~$25-30 (1 vCPU, 2GB RAM, 24/7)
- ECR Storage: $1-2 per GB
- Data Transfer: $0.09 per GB
- **Total: ~$30-35/month**

### Preview Environments (Monthly per PR)

- App Runner: ~$12-15 (0.5 vCPU, 1GB RAM, 1 instance minimum)
- Costs are lower when idle (only memory provisioned, no CPU usage)
- ECR Storage: Shared with production
- **Total: ~$12-15/month per preview**

### Example with 5 Active PRs

- Production: $35
- 5 Previews: $70
- **Total: ~$105/month**

**Cost Optimization Tips**:

- Delete preview environments promptly after PR merge (automated)
- Preview environments use smaller instance sizes (50% of production)
- Monitor idle previews and manually delete if needed

## Cleanup

### Remove All Preview Environments

```bash
cd terraform/frontend
terraform init -backend-config=../environments/preview/backend.config

# List all preview workspaces
terraform workspace list

# Destroy each one
for ws in $(terraform workspace list | grep preview-pr | tr -d '*'); do
  terraform workspace select $ws
  terraform destroy -auto-approve
  terraform workspace select default
  terraform workspace delete $ws
done
```

### Delete Production

```bash
cd terraform/frontend
terraform init -backend-config=../environments/prod/backend.config
terraform workspace select prod
terraform destroy
```

### Delete All Infrastructure

```bash
# 1. Delete all environments (production + previews)
cd terraform/frontend
# ... destroy each workspace ...

# 2. Delete account-level resources
cd ../account-level
terraform destroy
```

## Best Practices

1. **Always use feature branches** and create PRs to test changes in preview environments
2. **Add version labels to PRs** - required for CI to pass and for versioning
3. **Review preview environments** before merging to production
4. **Deploy to production from version tags** - never deploy untagged commits
5. **Monitor costs** in AWS Cost Explorer, especially for preview environments
6. **Clean up old images** in ECR regularly (automated via lifecycle policy)

## Security Considerations

1. **IAM Roles**: Follow principle of least privilege
2. **Secrets Management**: Store sensitive values in AWS Secrets Manager or SSM Parameter Store
3. **Network Security**: App Runner services are public by default; use WAF for additional protection
4. **Image Scanning**: ECR automatic scanning is enabled for vulnerability detection
5. **HTTPS Only**: All traffic is encrypted via HTTPS (App Runner default)
6. **OIDC Authentication**: GitHub Actions uses OpenID Connect (no long-lived credentials)

## Image Tagging Strategy

| Environment | Pattern                   | Example          | Purpose                |
| ----------- | ------------------------- | ---------------- | ---------------------- |
| Production  | `v.X.Y.Z`                 | `v.1.2.3`        | Semantic version tag   |
| Preview     | `pr-{number}-{short_sha}` | `pr-144-a1b2c3d` | PR number + commit SHA |

**Production Tags:**

- Uses semantic versioning (`v.X.Y.Z`)
- Created automatically when PRs are merged
- Immutable - each version deployed once
- Provides clear release history

**Preview Tags:**

- Includes SHORT_SHA (7-char commit hash)
- Unique per commit on each PR
- Forces App Runner to pull new image
- Prevents stale deployments

## Public Docker Image (GHCR)

The Block Explorer image is also published to **GitHub Container Registry** (`ghcr.io`) as a public image. This allows anyone to pull and run the explorer locally — useful when running a local VeChain node and wanting a block explorer alongside it.

### Automated Publishing

Every successful production deployment automatically pushes the image to GHCR with both the version tag and `latest`. This is handled by the `push-ghcr` job in `deploy-production.yml`, which runs after the deploy job completes.

### Manual Publishing

For ad-hoc pushes outside the CI pipeline:

```bash
# Login to GHCR (one-time, requires a GitHub PAT or `gh auth token`)
echo $(gh auth token) | docker login ghcr.io -u $(gh api user --jq .login) --password-stdin

# Build and push the "latest" image to GHCR
pnpm ghcr:push
```

To push a specific version tag instead of `latest`:

```bash
docker build -t ghcr.io/vechain/block-explorer:v.1.2.3 .
docker push ghcr.io/vechain/block-explorer:v.1.2.3
```

### Pulling the image

Since the image is public, no authentication is needed to pull:

```bash
docker pull ghcr.io/vechain/block-explorer:latest
```

Or in a `docker-compose.yml`:

```yaml
services:
  block-explorer:
    image: ghcr.io/vechain/block-explorer:latest
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
      - NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL=${NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL}
      - B32_URL=${B32_URL}
      - NEXT_PUBLIC_COIN_API_URL=${NEXT_PUBLIC_COIN_API_URL}
      - NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL}
      - NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL}
      - NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL}
      - NEXT_PUBLIC_IS_SOLO=${NEXT_PUBLIC_IS_SOLO}
      - NEXT_PUBLIC_SOLO_NODE_URL=${NEXT_PUBLIC_SOLO_NODE_URL}
```

## Support

For issues or questions:

1. Check CloudWatch Logs first
2. Review GitHub Actions workflow logs
3. Consult AWS App Runner documentation
4. Review Terraform state: `terraform show`

## Additional Resources

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Semantic Versioning](https://semver.org/)
