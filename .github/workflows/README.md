# GitHub Actions Workflows

Automated CI/CD for Block Explorer. Dev, prod and previews all run on ECS Fargate, from one image.

## The release path

```
PR merged to main
  → codebase-versioning.yml tags v.X.Y.Z (increment:* label picks the bump)
  → publish-ghcr-image.yml builds the multi-arch image, or aliases one it already has
  → deploy.yml promotes it to ECR and deploys dev
  → prepare-release.yml leaves exactly one draft release

Draft published
  → deploy.yml deploys prod
```

### Content-addressed images

Every merge to `main` gets a version tag, but most releases change nothing the Docker build reads —
terraform, workflows, tests and docs are all outside it. So the canonical image tag is a **content SHA**
(`app-<sha12>`) from [`scripts/app-content-sha.sh`](../../scripts/app-content-sha.sh), and the version
tags are aliases on the same manifest. Run it locally with `pnpm app:sha`.

Two things fall out of that. `publish-ghcr-image.yml` probes GHCR for the content SHA and skips both
arch builds when it is already published. And because the image tag is what Terraform pins, the task
definition of such a release is byte-identical, so `deploy.yml` skips the ECS roll too — it compares
the revision the apply registered against the one the service runs. Terraform still applies every
release; terraform changes are exactly what these releases carry.

The footer therefore shows the release that last *changed* the app, not the one being cut — that is
what is running. `APP_VERSION` reaches the container at start rather than being baked in, and the
deploy pins it to the image, so a no-op release registers no new revision.

Previews share that one namespace: nothing PR-specific is in the image, so a release can skip a build
a PR already did. `publish-ghcr-pr-image.yml` still publishes the `pr.{number}.{short_sha}` tag either
way, because that is the signal `deploy-preview.yml` waits on. Previews need no roll check: Terraform
owns the task definition there, so an unchanged image tag is already a no-op apply.

`deploy-preview.yml` promotes **from that commit alias**, not from a content tag it derives itself.
The two workflows hash different refs — the publish uses the default branch at build time, the deploy
uses the PR's base at event time — so a `labeled` event arriving after `scripts/app-content-sha.sh`
changed on `main` would otherwise name a content tag that was never published, and the copy would
fail. The alias resolves to the same manifest, and the ECR destination stays content-addressed.

## Workflows

### Deployment (`deploy.yml`)

One workflow for both environments, with the target derived from the trigger. Dev and prod deploy the
same image, so parity is structural rather than maintained by hand.

| Trigger | Target |
|---|---|
| Completion of `publish-ghcr-image.yml` | dev — the image is guaranteed to exist rather than polled for |
| A GitHub Release being published | prod — the single draft `prepare-release.yml` left |
| Manual dispatch | either, chosen by the `environment` input (break-glass, e.g. to roll back) |

**Jobs:**
1. `guard` - Resolves the target, the tag and its content SHA, refuses anything not reachable from `main`, and derives the per-environment names below
2. `promote` - Copies the GHCR manifest list into that account's ECR, keeping both arches. Each tag is written only if absent
3. `terraform` - Applies each stack serially in dependency order, planning immediately before each apply
4. `roll` - Wakes the service if it is parked (dev only), moves it to the new task definition revision unless it already runs it, then checks `/api/health` and that `/api/metrics` is 403, both over the ALB by name
5. `draft-release` - Calls `prepare-release.yml` (dev only, and not on dispatch)

**Domains:** `https://dev.block-explorer.vechain.org`, `https://block-explorer.vechain.org`

#### What actually differs between the two

`vars.AWS_OIDC_ROLE_ARN` resolves per GitHub Environment and prod approval is a protection rule on the
same object, so credentials need no conditional. `TF_VAR_prod_deploy_role_arn` and `TF_VAR_dns_role_arn`
are each set on one Environment only and pass unconditionally — the other resolves to `""`, which is
the off value the stacks already read as "not cross-account". Everything else is derived: the task
family is `block-explorer-<env>-frontend`, the config is `terraform/environments/<env>/<env>.yaml`,
and the workspace and backend config follow the same pattern. That leaves three `guard` outputs:

| | dev | prod |
|---|---|---|
| `image_tag` | `dev-app-<sha>` — the registry is shared with previews | `app-<sha>` |
| `alias_tag` | none | `v.X.Y.Z`, aliased onto the same manifest |
| `stacks` | the 8, plus `dns` and `preview-edge` | the 8 |

The ref a run starts on is part of the security model, because the credentialed jobs apply whatever
Terraform they check out. **Dev takes `main`'s tree with the tag's image; prod takes the tag's own
tree**, which is why a branch is refused there outright.

The `terraform` job never takes a `ref:` from event data — that would be an untrusted checkout with
execution, which CodeQL rates critical and `main`'s `code_scanning` rule blocks. Only the image
travels as a tag, and that is a string.

Stacks are applied serially, each planned immediately before its own apply. The design doc's parallel
plan matrix is deliberately not used: on a first deploy the downstream stacks cannot plan at all until
the upstream state they read exists. The plan file never leaves the job, because a binary plan can
carry state.

The `roll` job checks the ALB by name rather than by DNS. `services-stable` already means the tasks
are healthy in the target group, so what is left to prove is the ALB in front of them — and going
through DNS would let a cached or weighted answer pass the check on the deployed stack's behalf.

---

### Prepare Release Draft (`prepare-release.yml`)

Called by `deploy.yml` after a successful dev deploy. Deletes any stale `v.*` draft and cuts a fresh
one for the just-deployed tag, so cutting prod is "open the single draft and click Publish".

Notes start at the last *published* release, not GitHub's default baseline — every merge to `main`
produces a tag, so the default picks the previous dev-only cut.

It is a `workflow_call` rather than a `workflow_run` chained off the deploy, because the deploy's dev
path is itself `workflow_run`-triggered: its own `head_branch` is `main`, so the deployed tag is not
recoverable from the event payload. Passing it as an input is exact.

Skipped on `workflow_dispatch` deploys — a break-glass run may be redeploying an older tag, and
drafting a release for it would offer prod that rollback as the next cut.

---

### Hibernate Dev (`hibernate-dev.yml`)

**Triggers:** manual dispatch, `mode` of `hibernate` or `wake`

Parks `block-explorer-dev-frontend` at zero tasks when dev is not needed, and restores it to its
autoscaling floor on the way back. It shares `deploy.yml`'s `deploy-dev` concurrency group, so it
cannot interleave with a dev deploy.

Order is load-bearing: target tracking is suspended **before** the count drops, because Application
Auto Scaling holds a service at its target's `min_capacity` and a live target scales it straight back
out. Terraform does not manage `suspended_state`, so a suspension survives every apply — which is
also why hibernating and then deploying without waking would leave a service that cannot scale.

The service and cluster names come from `terraform/frontend`'s outputs rather than being spelled out
in the workflow: a wrong name scales nothing and still reports success.

Waking is idempotent and lives in two places. This workflow's `wake` mode is the operator's button;
`deploy.yml`'s `roll` job asserts the same thing on every **dev** deploy, so a dev deploy can never
land on a parked service. It reads the service rather than a flag, which means it also heals a
hibernate that half-applied and a service someone scaled down by hand, and it only acts *below* the
floor — capacity autoscaling put above it is not the deploy's to reset. It sits in `roll` rather than
in its own job because a job referencing a protected environment adds another approval gate to prod.

Prod is excluded rather than merely never parked. There, a suspended scalable target or a zero
desired count means someone is holding capacity down on purpose, and a deploy that silently lifted it
would undo an incident response — so the `/api/health` check is left to fail loudly instead.

**While hibernated:** `https://dev.block-explorer.vechain.org` returns 503. Nothing alarms — dev sets
`alerts_enabled: false`, which builds no alarms and no AMP alert rules at all, so there is no red
state to sit in and nothing to silence before parking the service.

Only the ECS task stops. The NAT gateway, both ALBs, the Valkey cache and the WAF bill on, and they
are most of what dev costs — hibernating buys back roughly the Fargate line, not the environment.

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

## Image Tagging Strategy

| Environment | Pattern | Example | Purpose |
|-------------|---------|---------|---------|
| Dev (ECS) | `dev-app-{sha12}` | `dev-app-ded8af8261c7` | Content SHA — what Terraform pins |
| Prod (ECS) | `app-{sha12}` | `app-ded8af8261c7` | Content SHA — what Terraform pins |
| Prod (alias) | `v.X.Y.Z` | `v.1.2.3` | Semantic version, aliased onto the same manifest |
| Preview | `pr-{number}-app-{sha12}` | `pr-144-app-ded8af8261c7` | PR number + content SHA |

**Content SHA tags:**
- From `scripts/app-content-sha.sh` — a hash of every Docker build input, so a squash merge or rebase
  that leaves the app unchanged keeps the same tag
- One image per distinct app build, however many releases ship it
- What ECS task definitions reference, so identical content produces an identical revision

**Production version tags:**
- Uses semantic versioning (`v.X.Y.Z`)
- Must match an existing git tag
- Immutable - each version written once
- An alias for readability and for the `v.`-prefixed ECR lifecycle rule, not what ECS resolves

**Preview Tags:**
- One per distinct app build on a PR, not one per commit
- Copied from `ghcr.io/vechain/block-explorer:pr.{number}.{short_sha}`, so the ECR tag is a manifest
  list and an arm64 task can resolve its own platform

---

## Authentication

OIDC throughout — no long-lived keys.

`vars.AWS_OIDC_ROLE_ARN` is set per GitHub Environment, one variable name resolving to a different
role in `dev` and in `prod`, which is what keeps every `if env == prod` conditional out of the
workflows. Prod approval is an Environment protection rule on the same object. The preview workflows
still use `secrets.AWS_ACC_ROLE`, the shared dev-account role.

Neither role ARN is committed: they carry account ids, and this repo is public.

```yaml
permissions:
  id-token: write      # OIDC token
  contents: read       # Checkout code
  pull-requests: write # Update PR comments
```

---

## Terraform State

One bucket per account, one key per stack, workspace-namespaced. Bucket names are in
`terraform/environments/<env>/backend.config`; the layout is in
[terraform/README.md](../../terraform/README.md).

**Workspaces:**
- `dev` / `prod` - one per environment, in different accounts
- `pr-{number}` - one per preview, in the dev account

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
- **Tasks:** 1, no autoscaling
- **CPU/Memory:** 512 / 1024, the same as dev, so a preview cannot OOM where dev does not
- **Cache:** shared with dev, namespaced by image tag
- **Auto-cleanup:** destroyed when the PR closes, and swept every six hours regardless

### Dev
- **Hibernation:** `hibernate-dev.yml` parks the service at zero tasks on demand; any dev deploy wakes it

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
- Check the Terraform plan in the job that failed — each stack is planned immediately before its apply
- Container logs are in CloudWatch under `/ecs/block-explorer-<env>-frontend`
- Ensure the environment config file is valid YAML

### PR comment not updating
- Verify `pull-requests: write` permission is set
- Check that PR is from same repository (not fork)
- Look for errors in `update-comment` job logs

### Concurrent deployments
- Concurrency control should prevent this
- If multiple deploys run, check concurrency group configuration
- Old builds should be cancelled automatically

### Custom domain not activating
- Check the ACM certificate is issued and its Route53 validation records exist
- Both public zones are in the dev account; prod writes into them through an assumed role
- The ALB's own DNS name works meanwhile — `curl --connect-to` is how the deploy verifies it

