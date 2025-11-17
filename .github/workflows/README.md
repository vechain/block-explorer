# GitHub Actions Workflows

Automated CI/CD for Block Explorer using GitHub Actions and AWS App Runner.

## Workflows

### Production Deployment (`deploy-production.yml`)

**Triggers:**
- Push to `main` branch (excludes `**.md`, `.github/**` except this workflow)
- Manual dispatch with `terraform_action` input (`apply`/`plan`)

**Jobs:**
1. `prepare-metadata` - Generates SHORT_SHA and image tag
2. `build-and-push` - Builds and pushes Docker image
3. `deploy` - Deploys to App Runner via Terraform

**Image Tag:** `prod-{short_sha}` (e.g., `prod-a1b2c3d`)

**Domain:** `https://block-explorer.vechain.org`

---

### Preview Deployment (`deploy-preview.yml`)

**Triggers:**
- PR opened/synchronized/reopened on `main` branch

**Concurrency:** Only latest commit per PR (older builds cancelled)

**Jobs:**
1. `pr-comment` - Posts initial "Building" comment immediately
2. `prepare-metadata` - Generates SHORT_SHA and image tag
3. `build-and-push` - Builds and pushes Docker image
4. `deploy` - Deploys to App Runner via Terraform
5. `update-comment` - Updates PR comment with final status (always runs)

**Image Tag:** `pr-{number}-{short_sha}` (e.g., `pr-144-a1b2c3d`)

**Domain:** `https://pr-{number}.block-explorer-preview.vechain.org`

**PR Comment Features:**
- Single comment per PR (updates in-place, no spam)
- Status icons: 🔨 Building → ✅ Ready / ❌ Failed → 🗑️ Destroyed
- Shows both custom domain and default App Runner URL
- Includes commit link and UTC timestamp
- Note about 5-10 min custom domain activation

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

| Environment | Pattern | Example | Purpose |
|-------------|---------|---------|---------|
| Production | `prod-{short_sha}` | `prod-a1b2c3d` | 7-char commit SHA |
| Preview | `pr-{number}-{short_sha}` | `pr-144-a1b2c3d` | Forces App Runner to pull new image |

**Why SHORT_SHA?**
- Unique per commit
- Terraform detects changes
- App Runner pulls latest image
- Prevents stale deployments

**Note:** No `latest` tag is used (removed for consistency with original behavior)

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
- Keeps last 30 production images
- Keeps last 10 preview images
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

