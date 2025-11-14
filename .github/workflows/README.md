# GitHub Actions Workflows

This directory contains CI/CD workflows for the Block Explorer application.

## Workflows

### 1. `deploy-production.yml`
Deploys to production environment on push to `main` branch.

**Triggers:**
- Push to `main` branch (excluding docs/workflow changes)
- Manual workflow dispatch

**Process:**
1. Builds Docker image with tag `prod-{short-sha}`
2. Pushes to ECR
3. Updates production Terraform config
4. Deploys via App Runner

**Environment:**
- Production: `https://block-explorer.vechain.org`

### 2. `deploy-preview.yml`
Creates/updates preview environments for pull requests.

**Triggers:**
- PR opened
- PR synchronized (new commits)
- PR reopened

**Process:**
1. Posts initial PR comment with "Building" status
2. Builds Docker image with tag `pr-{number}-{short-sha}`
3. Pushes to ECR (single platform image, no attestations)
4. Creates/updates Terraform workspace for preview
5. Deploys via App Runner
6. Updates PR comment with "Ready" status and preview URL

**Environment:**
- Preview: `https://pr-{number}.block-explorer-preview.vechain.org`

**PR Comment Features:**
- Single comment per PR (updates on each commit)
- Shows build status (Building/Ready/Failed/Destroyed)
- Links to commit and preview URL
- Timestamps in UTC
- Vercel-style table format

### 3. `destroy-preview.yml`
Destroys preview environments when PRs are closed/merged.

**Triggers:**
- PR closed
- PR merged

**Process:**
1. Destroys Terraform resources
2. Deletes Terraform workspace
3. Cleans up environment config
4. Updates PR comment with "Destroyed" status

### 4. `unit-test.yml`
Runs unit tests on pull requests.

**Triggers:**
- PR to `main` branch

**Process:**
1. Sets up Node.js 20 and pnpm 9.15.4
2. Installs dependencies
3. Runs tests with `pnpm test`
4. Uploads coverage report

## Image Tagging Strategy

### Production
- Pattern: `prod-{short-sha}`
- Example: `prod-abc1234`
- Also tagged as `latest`

### Preview
- Pattern: `pr-{number}-{short-sha}`
- Example: `pr-123-abc1234`
- **Why include commit SHA?** 
  - Ensures unique tag per commit
  - Forces App Runner to pull new image
  - Terraform detects changes and updates service

## Docker Build Configuration

All builds use the following settings:
- **Platform:** `linux/amd64` (single platform)
- **Provenance:** `false` (prevents multi-platform manifest)
- **SBOM:** `false` (prevents attestation artifacts)
- **Result:** Clean, single-platform image in ECR (no index)

## AWS Authentication

All workflows use OIDC authentication:
- **Provider:** GitHub OIDC
- **Role:** `${{ secrets.AWS_ACC_ROLE }}`
- **Permissions:** `id-token: write`, `contents: read`, `pull-requests: write`

## Secrets Required

Configure these in GitHub repository settings:
- `AWS_ACC_ROLE` - ARN of IAM role with OIDC trust policy

## Environment Variables

- `AWS_REGION`: `eu-west-1`
- `ECR_REPOSITORY`: `block-explorer`
- `TERRAFORM_VERSION`: `1.6.0`

## Terraform Backend

- **Production:** `block-explorer-terraform-state-prod`
- **Previews:** `block-explorer-terraform-state-nonprod`

## Notes

- Preview environments automatically scale down when idle (min_size: 1)
- Preview environments are destroyed automatically on PR close/merge
- Each preview has isolated Terraform workspace
- PR comments are updated in-place (not new comments per commit)

