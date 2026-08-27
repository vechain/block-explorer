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
- PR opened/synchronized/reopened/labeled on `main` branch, gated on the `create-preview` label

**Concurrency:** Shared with `destroy-preview.yml` per PR, never cancelling

**Jobs:**
1. `gate` - Requires the `create-preview` label; a `labeled` event for any other label is a no-op
2. `announce` - Posts the sticky "deploying" comment
3. `image` - Waits for the multi-arch GHCR PR image, then copies the manifest list into ECR
4. `deploy` - Applies `terraform/frontend-preview` in workspace `pr-{number}`, waits for the service, checks `/api/health`
5. `comment` - Updates the sticky comment with the URL or a link to the logs

**Image:** promoted from `ghcr.io/vechain/block-explorer:pr.{number}.{short_sha}`, published by
`publish-ghcr-pr-image.yml` once the unit tests pass. Previews are not rebuilt — they run the same
arm64 image dev and prod do.

**Domain:** `https://pr-{number}.block-explorer-preview.vechain.org`, served by the shared preview ALB.

---

### Preview Cleanup (`destroy-preview.yml`)

**Triggers:**
- PR closed/merged

**Security:** Only runs for same-repo PRs (not forks)

**Jobs:**
1. `destroy` - Destroys the `pr-{number}` workspace, deletes it, updates the sticky comment

Removing the `create-preview` label does not tear a preview down; `preview-reconcile.yml` reaps it
within six hours.

---

### Preview Reconcile (`preview-reconcile.yml`)

**Triggers:**
- Every six hours, and on demand

Event-driven teardown misses cleanups — a queued destroy can be evicted from the shared concurrency
group by a newer run, a destroy can fail on a throttle or a lock, and a long-lived labelled PR sits
forever. This sweep lists the `pr-*` Terraform workspaces (the workspace list is the source of truth,
not tags or an ECS listing) and destroys the ones whose PR is closed or no longer labelled.

It is deliberately conservative: it skips on any failed PR query, re-confirms immediately before
destroying, treats an already-gone workspace as reaped, and isolates each reap so one stuck workspace
cannot starve the rest.

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

**Used By:** `deploy-production.yml`

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
| Production | `v.X.Y.Z` | `v.1.2.3` | Semantic version tag |
| Preview | `pr-{number}-{short_sha}` | `pr-144-a1b2c3d` | PR number + 7-char commit SHA |

**Production Tags:**
- Uses semantic versioning (`v.X.Y.Z`)
- Must match an existing git tag
- Immutable - each version deployed once
- Provides clear release history

**Preview Tags:**
- Includes SHORT_SHA (7-char commit hash)
- Unique per commit on each PR
- Copied from `ghcr.io/vechain/block-explorer:pr.{number}.{short_sha}`, so the ECR tag is a manifest
  list and an arm64 task can resolve its own platform

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
TERRAFORM_VERSION: 1.16.0
PROJECT_NAME: block-explorer
PREVIEW_DOMAIN_SUFFIX: block-explorer-preview.vechain.org
```

---

## Terraform State

| Environment | Bucket | Key |
|-------------|--------|-----|
| Production | `vechain-terraform-state-prod` | `env:/production/frontend/terraform.tfstate` |
| Previews | `block-explorer-terraform-state-nonprod` | `env:/pr-{number}/frontend-preview/terraform.tfstate` |

**Workspaces:**
- `production` - Production environment (App Runner, until the cutover)
- `pr-{number}` - One workspace per preview

---

## Preview Environment Lifecycle

```
`create-preview` label added, or a push to an already-labelled PR:
  → Post "deploying" comment
  → Wait for the GHCR PR image, copy it into ECR
  → terraform apply in workspace pr-{number}
  → Update comment to "ready" (with the URL)

Label removed:
  → Nothing immediately; the reconcile sweep reaps within six hours

PR Closed/Merged:
  → terraform destroy, delete the workspace
  → Update comment to "torn down"
```

### GitHub Environments are shared, Terraform workspaces are per-PR

Every preview job runs against the single `preview` GitHub Environment, with `environment.url` set per
deployment so the PR timeline still links to the right preview. The per-PR name lives only in the
Terraform workspace (`pr-{number}`), which `destroy-preview.yml` and `preview-reconcile.yml` reap.

Do not name a GitHub Environment after the PR. Declaring `environment: preview-pr-N` creates that
environment implicitly and nothing can remove it: `GITHUB_TOKEN` has no `environments` or
`administration` permission, so the delete API is out of reach from a workflow. 113 of them
accumulated before this was noticed. If a per-PR environment is ever genuinely needed, the teardown
step needs a PAT or GitHub App token with Environments write, and it has to be added in the same
change that introduces the environment.

---

## Concurrency Control

**Configuration:**
```yaml
concurrency:
  group: preview-pr-${{ github.event.pull_request.number }}
  cancel-in-progress: false
```

**Behavior:**
- Prevents race conditions with Terraform
- Each PR has isolated concurrency group
- Different PRs can deploy simultaneously

`cancel-in-progress` is `false` because deploy and destroy share the group: GitHub evaluates it on
the incoming run, so `true` would let a deploy cancel a teardown mid-destroy and strand the state
lock. The cost is that a queued teardown can be evicted by a newer run, which is what
`preview-reconcile.yml` exists to catch.

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

