# GitHub Actions Workflows

Automated CI/CD for Block Explorer. Dev and previews run on ECS Fargate; production is still on
App Runner until the cutover.

## The release path

```
PR merged to main
  → codebase-versioning.yml tags v.X.Y.Z (increment:* label picks the bump)
  → publish-ghcr-image.yml builds the multi-arch image, or aliases one it already has
  → deploy-dev.yml promotes it to ECR and deploys dev
  → prepare-release.yml leaves exactly one draft release

Draft published
  → deploy-production.yml deploys prod
```

### Content-addressed images

Every merge to `main` gets a version tag, but most releases change nothing the Docker build reads —
terraform, workflows, tests and docs are all outside it. So the canonical image tag is a **content SHA**
(`app-<sha12>`) from [`scripts/app-content-sha.sh`](../../scripts/app-content-sha.sh), and the version
tags are aliases on the same manifest. Run it locally with `pnpm app:sha`.

Two things fall out of that. `publish-ghcr-image.yml` probes GHCR for the content SHA and skips both
arch builds when it is already published. And because the image tag is what Terraform pins, the task
definition of such a release is byte-identical, so `deploy-dev.yml` and `deploy-prod.yml` skip the ECS
roll too — each compares the revision the apply registered against the one the service runs. Terraform
still applies every release; terraform changes are exactly what these releases carry.

The version baked into the bundle is therefore the release that last *changed* the app, not the one
being cut. That is what is running, so it is what the footer says.

Previews work the same way, with the content SHA scoped per PR (`pr.{number}.app-{sha}`) so a push
reuses only its own PR's image and never inherits another PR's baked version. `publish-ghcr-pr-image.yml`
still publishes the `pr.{number}.{short_sha}` tag either way, because that is the signal
`deploy-preview.yml` waits on. Previews need no roll check: Terraform owns the task definition there,
so an unchanged image tag is already a no-op apply.

## Workflows

### Dev Deployment (`deploy-dev.yml`)

**Triggers:**
- Completion of `publish-ghcr-image.yml`, so the image is guaranteed to exist rather than polled for
- Manual dispatch with a version tag (break-glass, e.g. to roll back)

**Jobs:**
1. `guard` - Resolves the tag and its content SHA, and refuses anything not reachable from `main`
2. `promote` - Copies the GHCR manifest list into ECR as `dev-app-<sha>`, keeping both arches. Skipped when that tag is already there
3. `terraform` - Applies each stack serially in dependency order, planning immediately before each apply
4. `roll` - Moves the service to the new task definition revision unless it already runs it, then checks `/api/health` and that `/api/metrics` is 403
5. `draft-release` - Calls `prepare-release.yml` (not on dispatch)

**Domain:** `https://dev.block-explorer.vechain.org`

The `terraform` job takes the default checkout and passes the tag through as a string. It holds AWS
credentials and Terraform executes whatever is in the tree, so checking out a `ref:` taken from event
data would be an untrusted checkout with execution — CodeQL rates it critical and `main`'s
`code_scanning` rule blocks the merge.

---

### Prepare Release Draft (`prepare-release.yml`)

Called by `deploy-dev.yml` after a successful deploy. Deletes any stale `v.*` draft and cuts a fresh
one for the just-deployed tag, so cutting prod is "open the single draft and click Publish".

Notes start at the last *published* release, not GitHub's default baseline — every merge to `main`
produces a tag, so the default picks the previous dev-only cut.

It is a `workflow_call` rather than a `workflow_run` chained off the deploy, because "Deploy to Dev"
is itself `workflow_run`-triggered: its own `head_branch` is `main`, so the deployed tag is not
recoverable from the event payload. Passing it as an input is exact.

Skipped on `workflow_dispatch` deploys — a break-glass run may be redeploying an older tag, and
drafting a release for it would offer prod that rollback as the next cut.

---

### Static Checks (`static-checks.yml`)

Runs the org's reusable `checkov.yaml` and `action-lint.yaml` on every PR and on `main`, behind a
single `Static checks` aggregator job so branch protection needs one entry rather than a context per
reusable workflow.

Checkov is `soft_fail: true` for now: it reports 45 findings across the Terraform, most of them
accepted design decisions (public ALB on :80 redirecting to :443, the wildcard preview cert, no
DNSSEC, AWS-managed secret encryption). A follow-up records those in a `.checkov.yaml` and flips the
flag in the same change. actionlint hard-fails.

No `paths:` filter, deliberately. A filtered workflow never reports on a PR that misses the filter,
which would leave that PR waiting forever on a required status.

`.github/actionlint-matcher.json` is vendored from actionlint v1.7.8 because the reusable workflow
registers it with `::add-matcher::` unconditionally, and the runner fails the step when the file is
absent. It only annotates findings onto the diff.

---

### Production Deployment (`deploy-production.yml`)

**Triggers:**
- A GitHub Release being published

**Jobs:**
1. `validate-version-format` - Validates the tag is `v.X.Y.Z`
2. `promote-to-ecr` - Copies the GHCR image into ECR as `v.X.Y.Z` (plus `latest` for stable versions)
3. `deploy` - Applies `terraform/app-runner` in workspace `prod`

**Domain:** `https://block-explorer.vechain.org`

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

**Image:** promoted from `ghcr.io/vechain/block-explorer:pr.{number}.app-{sha12}`, published by
`publish-ghcr-pr-image.yml` once the unit tests pass. Previews are not rebuilt — they run the same
arm64 image dev and prod do. The `image` job waits on the commit-tagged alias, which that workflow
publishes whether or not it built anything.

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
| Dev (ECS) | `dev-app-{sha12}` | `dev-app-ded8af8261c7` | Content SHA — what Terraform pins |
| Prod (ECS) | `app-{sha12}` | `app-ded8af8261c7` | Content SHA — what Terraform pins |
| Prod (alias) | `v.X.Y.Z` | `v.1.2.3` | Semantic version, aliased onto the same manifest |
| Preview | `pr-{number}-app-{sha12}` | `pr-144-app-ded8af8261c7` | PR number + content SHA |

**Content SHA tags:**
- From `scripts/app-content-sha.sh` — the last commit touching a Docker build input
- One image per distinct app build, however many releases ship it
- What ECS task definitions reference, so identical content produces an identical revision

**Production version tags:**
- Uses semantic versioning (`v.X.Y.Z`)
- Must match an existing git tag
- Immutable - each version written once
- An alias for readability and for the `v.`-prefixed ECR lifecycle rule, not what ECS resolves

**Preview Tags:**
- One per distinct app build on a PR, not one per commit
- Copied from `ghcr.io/vechain/block-explorer:pr.{number}.app-{sha12}`, so the ECR tag is a manifest
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

