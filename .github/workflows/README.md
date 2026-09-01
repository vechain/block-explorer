# GitHub Actions Workflows

Automated CI/CD for Block Explorer. Dev, prod and previews all serve one static bundle from CloudFront.

## The release path

```
PR merged to main
  → codebase-versioning.yml tags v.X.Y.Z (increment:* label picks the bump)
  → publish-bundle.yml builds the static bundle, or finds one it already has
  → deploy.yml copies it into dev's bucket and points dev at it
  → prepare-release.yml leaves exactly one draft release

Draft published
  → deploy.yml deploys prod
```

### Content-addressed bundles

Every merge to `main` gets a version tag, but most releases change nothing the build reads —
terraform, workflows, tests and docs are all outside it. So a bundle's identity is a **content SHA**
(`app-<sha12>`) from [`scripts/app-content-sha.sh`](../../scripts/app-content-sha.sh), which is both
the artifact's name and its prefix in the bucket. Run it locally with `pnpm app:sha`.

Two things fall out of that. `publish-bundle.yml` probes for a live artifact of that name and skips
the build when it finds one. And `deploy.yml`'s `publish` job skips its upload when the prefix is
already in the bucket, because the same SHA is the same bytes. Terraform still applies every release;
terraform changes are exactly what these releases carry.

The footer therefore shows the release that last *changed* the app, not the one being cut — that is
what is running. `APP_VERSION` reaches the browser in `<env>/runtime-config.json` rather than being
baked in, and `activate` pins it to the bundle, so a no-op release rewrites nothing.

Previews share that identity: nothing PR-specific is in a bundle, so a release can skip a build a PR
already did, and a preview usually finds its bundle already in the bucket. Both `unit-test.yml` and
`deploy-preview.yml` resolve the SHA with the default branch's copy of the script, so the name one
publishes is the name the other waits for — and a pull request cannot publish under a release's name
by editing that script.

## Workflows

### Deployment (`deploy.yml`)

One workflow for both environments, with the target derived from the trigger. Dev and prod deploy the
same bundle, so parity is structural rather than maintained by hand.

| Trigger | Target |
|---|---|
| Completion of `publish-bundle.yml` | dev — the bundle is guaranteed to exist rather than polled for |
| A GitHub Release being published | prod — the single draft `prepare-release.yml` left |
| Manual dispatch | either, chosen by the `environment` input (break-glass, e.g. to roll back) |

**Jobs:**
1. `guard` - Resolves the target, the tag and its content SHA, refuses anything not reachable from `main`, and derives the stack list below
2. `terraform` - Applies each stack serially in dependency order, planning immediately before each apply
3. `publish` - Copies the bundle artifact into that environment's bucket, unless the prefix is already there
4. `activate` - Writes `<env>/runtime-config.json`, points the environment's hosts at the new bundle, invalidates the config, then checks the CDN by its own name
5. `draft-release` - Calls `prepare-release.yml` (dev only, and not on dispatch)

`publish` runs after `terraform` because the bucket is terraform's to create, and `activate` after
`publish` because the routing store must never name a prefix that is not there yet. That ordering is
what makes a deploy seamless: the hosts keep answering from the previous bundle until the last step.

**Domains:** `https://dev.block-explorer.vechain.org`, `https://block-explorer.vechain.org`

#### What actually differs between the two

`vars.AWS_OIDC_ROLE_ARN` resolves per GitHub Environment and prod approval is a protection rule on the
same object, so credentials need no conditional. `TF_VAR_prod_deploy_role_arn` and `TF_VAR_dns_role_arn`
are each set on one Environment only and pass unconditionally — the other resolves to `""`, which is
the off value the stacks already read as "not cross-account". Everything else is derived: the task
family is `block-explorer-<env>-frontend`, the config is `terraform/environments/<env>/<env>.yaml`,
and the workspace and backend config follow the same pattern. That leaves one `guard` output that
differs: `stacks`, which is the nine both share plus `dns` and `preview-edge` in dev, because the
previews live in that account and so does the zone role `dns/` hands prod.

The ref a run starts on is part of the security model, because the credentialed jobs apply whatever
Terraform they check out. **Dev takes `main`'s tree with the tag's bundle; prod takes the tag's own
tree**, which is why a branch is refused there outright.

The `terraform` job never takes a `ref:` from event data — that would be an untrusted checkout with
execution, which CodeQL rates critical and `main`'s `code_scanning` rule blocks. Only the content SHA
travels, and that is a string.

Stacks are applied serially, each planned immediately before its own apply. The design doc's parallel
plan matrix is deliberately not used: on a first deploy the downstream stacks cannot plan at all until
the upstream state they read exists. The plan file never leaves the job, because a binary plan can
carry state.

The `activate` job checks the distribution by its own CloudFront name rather than by the public one.
Going through DNS would let a cached or weighted answer pass the check on the deployed stack's behalf
— and while an environment is still `hosting: ecs`, the public name is not pointed here at all.

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
3. `deploy` - Waits for the PR's bundle, copies it into dev's bucket if it is not already there, writes `pr-{number}/runtime-config.json`, adds the host's key to the routing store, then checks the URL
4. `comment` - Updates the sticky comment with the URL or a link to the logs

**Bundle:** built by `unit-test.yml` once the tests pass, and named by content, so a preview usually
finds a bundle dev or another PR already published. That build runs on `pull_request` rather than in a
privileged workflow, so a pull request's own code never executes anywhere the release path can reach —
which is also why the build steps are a composite action (`.github/actions/build-bundle`) rather than a
reusable workflow: a composite inherits its caller's trust context, a reusable workflow is analysed
under every caller's at once.

**Domain:** `https://pr-{number}.block-explorer-preview.vechain.org`, served by dev's distribution —
previews own no infrastructure of their own, only a key and a config file.

---

### Preview Cleanup (`destroy-preview.yml`)

**Triggers:**
- PR closed/merged

**Security:** Only runs for same-repo PRs (not forks)

**Jobs:**
1. `destroy` - Deletes the host's key from the routing store and the `pr-{number}/` prefix, then updates the sticky comment

The bundle stays: it is content-addressed and shared with dev and with any other PR on the same
content, so deleting it would break them.

Removing the `create-preview` label does not tear a preview down; `preview-reconcile.yml` reaps it
within six hours.

---

### Preview Reconcile (`preview-reconcile.yml`)

**Triggers:**
- Every six hours, and on demand

Event-driven teardown misses cleanups — a queued destroy can be evicted from the shared concurrency
group by a newer run, a destroy can fail on a throttle or a lock, and a long-lived labelled PR sits
forever. This sweep lists the `pr-*` keys in the routing store (the store is the source of truth, because a
key is the only thing that makes a preview host answer) and deletes the ones whose PR is closed or no
longer labelled.

It is deliberately conservative: it skips on any failed PR query, re-confirms immediately before
deleting, treats an already-gone key as reaped, and isolates each reap so one stuck preview cannot
starve the rest.

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

## Where a bundle lives

| Store | Key | Purpose |
|---|---|---|
| Workflow artifact | `app-{sha12}` | The built bundle, retained 90 days for a release and 14 for a PR |
| S3 | `app-{sha12}/…` | What the CDN serves. One prefix per distinct build, shared by dev, prod and every preview |
| S3 | `{env}/runtime-config.json` | Per environment: the version, the dev-mode flag and the solo overrides |
| KeyValueStore | host → `{bundle, config}` | Which of the above a host answers from |

`app-{sha12}` comes from `scripts/app-content-sha.sh`, a hash of every input the build reads, so a
squash merge or rebase that leaves the app unchanged keeps the same name — one bundle per distinct
build, however many releases ship it.

Version tags (`v.X.Y.Z`) never name a bundle. They are what `activate` writes into
`runtime-config.json`, and a release whose bundle is already serving keeps the version that shipped it.

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
  → Wait for the PR's bundle, copy it into the bucket if it is not already there
  → Write pr-{number}/runtime-config.json and the host's routing key
  → Update comment to "ready" (with the URL)

Label removed:
  → Nothing immediately; the reconcile sweep reaps within six hours

PR Closed/Merged:
  → Delete the routing key and the pr-{number}/ prefix
  → Update comment to "torn down"
```

### GitHub Environments are shared, routing keys are per-PR

Every preview job runs against the single `preview` GitHub Environment, with `environment.url` set per
deployment so the PR timeline still links to the right preview. The per-PR name lives only in the
routing store, which `destroy-preview.yml` and `preview-reconcile.yml` reap.

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
- **Compute:** none. A preview is a prefix in dev's bucket plus one routing key
- **Bundle:** shared with dev and with any PR on the same content, so most previews upload nothing
- **Auto-cleanup:** the key and the config go when the PR closes, and are swept every six hours regardless

### Bundles
- Old prefixes are not reaped. They are a few MB each and one of them may still be what an
  environment serves, so age is not a safe signal for deleting one

---

## Troubleshooting

### Build failures
- Check the `Build Static Bundle` job in `publish-bundle.yml`, or `Build Preview Bundle` in `unit-test.yml`
- Verify `pnpm-lock.yaml` is compatible with pnpm 9.15.4

### Deployment failures
- Check the Terraform plan in the job that failed — each stack is planned immediately before its apply
- `publish` failing on a missing artifact means it expired; re-run `publish-bundle.yml` for that tag
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
- Check the ACM certificate is issued and its Route53 validation records exist. CloudFront reads its
  certificate from us-east-1 only, so `cdn/` holds a second one for the same names
- Both public zones are in the dev account; prod writes into them through an assumed role
- The distribution's own name works meanwhile, and is what the deploy verifies against

