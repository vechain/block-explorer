# GitHub Actions Workflows

Automated CI/CD for Block Explorer using GitHub Actions and AWS App Runner.

## Workflows

### Production Deployment (`deploy-production.yml`)

**Triggers:**
- Manual workflow dispatch only (no automatic deployments)

**Required Inputs:**
- `terraform_action`: Choose between `dry-run` (plan only) or `deploy` (apply)
- Must be triggered from a version tag (format: `v.X.Y.Z`)

**Jobs:**
1. `validate-version-format` - Validates version tag format
2. `check-existing-release` - Checks if release already exists
3. `prepare-metadata` - Extracts version from tag
4. `build-and-push` - Builds and pushes Docker image
5. `deploy` - Deploys to App Runner via Terraform (if action is `deploy`)

**Image Tag:** `v.X.Y.Z` (e.g., `v.1.2.3`) - uses the version tag directly

**Domain:** `https://block-explorer.vechain.org`

**Deployment Process:**
1. Create a version tag matching pattern `v.X.Y.Z`
2. Go to Actions → Deploy to Production → Run workflow
3. Select the version tag from dropdown
4. Choose `dry-run` to preview changes or `deploy` to apply
5. Monitor deployment progress

---

### Preview Deployment (`deploy-preview.yml`)

**Triggers:**
- PR opened/synchronized/reopened on `main` branch

**Concurrency:** Only latest commit per PR (older builds cancelled)

**How It Works:**
- **First PR open** (`opened`): Builds image + creates App Runner service via Terraform
- **Subsequent commits** (`synchronize`): Builds and pushes new image - App Runner auto-deploys
- **Auto-deployments**: App Runner detects new images with tag `pr-{number}` and automatically deploys them

**Jobs:**
1. `pr-comment` - Posts initial "Building" comment
2. `build-and-push` - Builds and pushes Docker image
3. `setup-preview-infra` - Creates App Runner service (only on first open)
4. `update-comment` - Updates PR comment with final status

**Image Tag:** `pr-{number}` (e.g., `pr-144`)

**Domain:** `https://pr-{number}.block-explorer-preview.vechain.org`

**Performance:**
- First deployment: ~3-5 minutes (infrastructure setup)
- Subsequent deployments: ~2-3 minutes (auto-deploy only)

**PR Comment Features:**
- Single comment per PR (updates in-place, no spam)
- Status icons: 🔨 Building → 🚀 Deploying / ❌ Failed → 🗑️ Destroyed
- Shows custom domain URL
- Includes commit link and UTC timestamp

---

### Preview Cleanup (`destroy-preview.yml`)

**Triggers:**
- PR closed/merged

**Security:** Only runs for same-repo PRs (not forks)

**Jobs:**
1. `destroy` - Runs `terraform destroy`, deletes workspace, cleans up config, updates PR comment

**PR Comment:** Updates to "🗑️ Destroyed" status

---

### Unit Tests (`unit-test.yml`)

**Triggers:**
- PR to `main` branch

**Process:**
1. Setup Node.js 20 + pnpm 9.15.4
2. Install dependencies
3. Run `pnpm test`
4. Upload coverage report

---

### Build & Push (Reusable) (`build-push-ecr.yml`)

**Purpose:** Reusable workflow for building and pushing Docker images

**Used By:** `deploy-production.yml`, `deploy-preview.yml`

**Inputs:**
- `ecr_repository` - ECR repository name
- `image_tag` - Docker image tag
- `aws_region` - AWS region
- `dockerfile_path` - Path to Dockerfile (default: `./Dockerfile`)
- `context_path` - Build context (default: `.`)

**Outputs:**
- `tag` - Image tag that was pushed
- `uri` - Full URI of pushed image

**Configuration:**
- Platform: `linux/amd64` (single platform only)
- Provenance: `false` (prevents manifest index)
- SBOM: `false` (prevents attestations)
- Cache: GitHub Actions cache

---

## Image Tagging Strategy

| Environment | Pattern | Example | Purpose | Auto-Deploy |
|-------------|---------|---------|---------|-------------|
| Production | `v.X.Y.Z` | `v.1.2.3` | Semantic version tag | Disabled |
| Preview | `pr-{number}` | `pr-144` | PR number only | Enabled |

**Production Tags:**
- Uses semantic versioning (`v.X.Y.Z`)
- Must match an existing git tag
- Immutable - each version deployed once
- Manual deployment for version control
- Auto-deployments **disabled** for explicit control

**Preview Tags:**
- Uses only PR number (no commit SHA)
- Same tag for all commits on a PR
- Auto-deployments **enabled** - App Runner detects new images
- Faster deployments (~60% reduction after first deploy)
- App Runner automatically pulls and deploys new images with the same tag

---

## Authentication

**Method:** OpenID Connect (OIDC)

**AWS Role:** `${{ secrets.AWS_ACC_ROLE }}`

**Permissions Required:**
```yaml
permissions:
  id-token: write      # OIDC token
  contents: read       # Checkout code
  pull-requests: write # Update PR comments
```

---

## Configuration

### Secrets (Repository Settings)

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACC_ROLE` | IAM role ARN with OIDC trust | `arn:aws:iam::123456789:role/github-actions` |

### Variables (Optional Repository Variables)

| Variable | Default | Override |
|----------|---------|----------|
| `AWS_REGION` | `eu-west-1` | Set via repository variables |
| `ECR_REPOSITORY` | `block-explorer` | Set via repository variables |

### Environment Variables (Workflow-level)

```yaml
AWS_REGION: eu-west-1
ECR_REPOSITORY: block-explorer
TERRAFORM_VERSION: 1.6.0
PROJECT_NAME: block-explorer
PREVIEW_DOMAIN_SUFFIX: block-explorer-preview.vechain.org
```

---

## Terraform State

| Environment | Bucket | Key |
|-------------|--------|-----|
| Production | `vechain-terraform-state-prod` | `env:/production/frontend/terraform.tfstate` |
| Previews | `vechain-terraform-state-nonprod` | `env:/preview-pr-{number}/frontend/terraform.tfstate` |

**Workspaces:**
- `production` - Production environment
- `preview-pr-{number}` - One workspace per PR

---

## Preview Environment Lifecycle

```
PR Opened/Updated:
  → Post "Building" comment
  → Build Docker image
  → Deploy to App Runner
  → Update comment to "Ready" (with URLs)

New Commit Pushed:
  → Cancel in-progress build (concurrency control)
  → Repeat deployment with new commit
  → Update existing comment (no new comment)

PR Closed/Merged:
  → Destroy all resources
  → Delete Terraform workspace
  → Update comment to "Destroyed"
```

---

## Concurrency Control

**Configuration:**
```yaml
concurrency:
  group: preview-pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Behavior:**
- Prevents race conditions with Terraform
- Cancels old builds when new commit pushed
- Each PR has isolated concurrency group
- Different PRs can deploy simultaneously

---

## Cost Optimization

### Preview Environments
- **Min instances:** 1 (App Runner requirement)
- **Max instances:** 2
- **CPU/Memory:** 512 MB / 1 GB (50% of production)
- **Auto-cleanup:** Destroyed when PR closes

### Image Lifecycle (ECR)
- Keeps last 30 production images (tagged `v.*`)
- Keeps last 10 preview images (tagged `pr-*`)
- Removes untagged images after 1 day

---

## Troubleshooting

### Build failures
- Check Docker build logs in GitHub Actions
- Verify `pnpm-lock.yaml` is compatible with pnpm 9.15.4
- Ensure Dockerfile exists and is valid

### Deployment failures
- Check Terraform logs in GitHub Actions
- Verify AWS credentials are valid
- Check App Runner service logs in CloudWatch
- Ensure environment config file is valid YAML

### PR comment not updating
- Verify `pull-requests: write` permission is set
- Check that PR is from same repository (not fork)
- Look for errors in `update-comment` job logs

### Concurrent deployments
- Concurrency control should prevent this
- If multiple deploys run, check concurrency group configuration
- Old builds should be cancelled automatically

### Custom domain not activating
- Wait 5-10 minutes after first deployment
- Check Route53 validation records exist
- Use default App Runner URL in the meantime
- Verify ACM certificate is issued

