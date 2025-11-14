# Block Explorer Deployment Guide

This document provides a comprehensive guide for deploying the Block Explorer application using AWS App Runner and Terraform.

## Architecture Overview

The infrastructure consists of:

- **Production Environment**: Single permanent App Runner service at `block-explorer-prod.vechain.org`
- **Preview Environments**: Ephemeral services at `pr-{number}.block-explorer-preview.vechain.org`
- **Terraform Workspaces**: Separate workspace for production and each preview
- **State Management**: S3 buckets with DynamoDB locking

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
   - Terraform >= 1.0
   - Docker
   - Node.js 20.17.0 (for local development)
   - pnpm 8.x

3. **GitHub Repository Secrets**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

## Initial Infrastructure Setup

### Step 1: Create S3 Backend

```bash
cd terraform/s3-backend
terraform init
terraform plan
terraform apply
```

**Created Resources**:
- `block-explorer-terraform-state-prod` - Production state bucket
- `block-explorer-terraform-state-nonprod` - Non-prod state bucket
- `block-explorer-terraform-lock-prod` - Production lock table
- `block-explorer-terraform-lock-nonprod` - Non-prod lock table

### Step 2: Deploy Account-Level Infrastructure

```bash
cd ../account-level
terraform init
terraform apply
```

**Created Resources**:
- ECR repository for Docker images
- IAM roles for App Runner
- ACM certificates (production + wildcard for previews)

**Important**: Save the outputs from this step:
```bash
terraform output
```

You'll need:
- `ecr_repository_url`
- `app_runner_instance_role_arn`
- `app_runner_access_role_arn`

### Step 3: Configure Route53 (if needed)

If you're managing DNS with Terraform:

1. Update `terraform/account-level/route53.tf` with your Route53 zone ID
2. Set `create_route53_records = true`
3. Reapply: `terraform apply`

Otherwise, manually create DNS records in your DNS provider.

## Production Deployment

### Automated (Recommended)

Simply push to the `main` branch:

```bash
git push origin main
```

The `deploy-production` GitHub Actions workflow will:
1. Build Docker image
2. Push to ECR with tag `prod-{sha}`
3. Update production config
4. Deploy via Terraform

### Manual Deployment

```bash
# 1. Get AWS ECR credentials
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

# 2. Build and push image
docker build -t block-explorer .
IMAGE_TAG="prod-$(git rev-parse --short HEAD)"
docker tag block-explorer:latest <ECR_URL>/block-explorer:${IMAGE_TAG}
docker push <ECR_URL>/block-explorer:${IMAGE_TAG}

# 3. Update config
cd terraform/environments/production
sed -i "s/^image_tag:.*/image_tag: ${IMAGE_TAG}/" production.yaml

# 4. Deploy
cd ../../frontend
terraform init -backend-config=../environments/production/backend.config
terraform workspace select production || terraform workspace new production
terraform plan
terraform apply
```

## Preview Environment Deployment

### Automated (Recommended)

Preview environments are automatically created when you:
1. Open a pull request
2. Push new commits to an existing PR

The preview URL will be posted as a comment on the PR.

### Manual Preview Deployment

```bash
PR_NUMBER=123

# 1. Build and push image
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

docker build -t block-explorer .
docker tag block-explorer:latest <ECR_URL>/block-explorer:pr-${PR_NUMBER}
docker push <ECR_URL>/block-explorer:pr-${PR_NUMBER}

# 2. Create config
mkdir -p terraform/environments/preview-pr-${PR_NUMBER}
cp terraform/environments/preview/preview.yaml.example \
   terraform/environments/preview-pr-${PR_NUMBER}/preview-pr-${PR_NUMBER}.yaml

# Edit the file and replace {PR_NUMBER} with ${PR_NUMBER}
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

File: `terraform/environments/production/production.yaml`

Key settings:
- `min_size: 1` - Always warm, no cold starts
- `max_size: 10` - Scale up to 10 instances under load
- `cpu: 1024` / `memory: 2048` - 1 vCPU, 2 GB RAM

### Preview Config

File: `terraform/environments/preview/preview.yaml.example`

Key settings:
- `min_size: 0` - Scale to zero when idle (cost savings)
- `max_size: 2` - Maximum 2 instances
- `cpu: 1024` / `memory: 2048` - Same as production

## Monitoring

### CloudWatch Logs

View logs for production:
```bash
aws logs tail /aws/apprunner/production-block-explorer/*/application --follow
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

## Cost Breakdown

**Important Note**: AWS App Runner requires a minimum of 1 instance (`min_size: 1`). It doesn't support scaling to zero. However, you only pay for provisioned memory when idle (not CPU), making costs very low for inactive preview environments.

### Production (Monthly)
- App Runner: ~$25-30 (1 vCPU, 2GB RAM, 24/7)
- ECR Storage: $1-2 per GB
- Data Transfer: $0.09 per GB
- **Total: ~$30-35/month**

### Preview Environments (Monthly per PR)
- App Runner: ~$12-15 (1 vCPU, 2GB RAM, 1 instance minimum)
- Costs are lower when idle (only memory provisioned, no CPU usage)
- ECR Storage: Shared with production
- **Total: ~$12-15/month per preview**

### Example with 5 Active PRs
- Production: $35
- 5 Previews: $70
- **Total: ~$105/month**

**Cost Optimization Tips**:
- Delete preview environments promptly after PR merge (automated)
- Use smaller instance sizes for previews (0.25 vCPU, 0.5GB RAM) if sufficient
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
terraform init -backend-config=../environments/production/backend.config
terraform workspace select production
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

# 3. Delete S3 backend (WARNING: This deletes all state!)
cd ../s3-backend
terraform destroy
```

## Best Practices

1. **Always use feature branches** and create PRs to test changes in preview environments
2. **Review preview environments** before merging to production
3. **Monitor costs** in AWS Cost Explorer, especially for preview environments
4. **Clean up old images** in ECR regularly (automated via lifecycle policy)
5. **Use semantic versioning** for production image tags
6. **Test locally** before pushing: `docker build . && docker run -p 3000:3000 <image>`

## Security Considerations

1. **IAM Roles**: Follow principle of least privilege
2. **Secrets Management**: Store sensitive values in AWS Secrets Manager or SSM Parameter Store
3. **Network Security**: App Runner services are public by default; use WAF for additional protection
4. **Image Scanning**: ECR automatic scanning is enabled for vulnerability detection
5. **HTTPS Only**: All traffic is encrypted via HTTPS (App Runner default)

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

