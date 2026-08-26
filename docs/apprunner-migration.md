# Migrating off AWS App Runner

Design doc for moving the block explorer from AWS App Runner onto ECS Fargate, adding a dev
environment, a separate prod account, observability, a WAF and a shared cache.

This document is the spec. Each phase below is delivered as its own PR and should start by
reading it — several decisions here rest on findings that are expensive to re-derive and easy to
get subtly wrong.

## Context

The AWS console warns that App Runner is closed to new customers. The actual text is narrower
than the warning implies:

> "we decided to close AWS App Runner to new customers. Existing AWS App Runner customers can
> continue to use the service as normal, including creating new resources and services. AWS
> continues to invest in security and availability for AWS App Runner, but we do not plan to
> introduce new features."

— [AWS App Runner availability change](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html)

There is **no shutdown date and no forced migration**. That matters for sequencing: we are not
racing a deadline, so we can build the replacement properly and cut over when it is proven.

The real driver is that the rest of the work is mostly _impossible_ on App Runner. A WAF needs an
ALB we own, ElastiCache needs VPC-attached tasks, Prometheus metrics need a sidecar, and dev/prod
parity needs an environment App Runner has no cheap way to express. Today there is no ALB, no
WAF, no VPC, no Redis, no metrics and no alarms — and prod plus every preview share one AWS
account.

### Requirements

1. Stop using App Runner
2. Preview environments only when a `create-preview` label is present
3. A dev environment mirroring prod, deployed on merge to `main`
4. Prod in `explorer-prod` (471112836208), deployed by publishing a draft release
5. Observability on Prometheus + Grafana
6. Slack alerting
7. A WAF with IP-based rate limiting, extensible
8. A shared Redis for the server-side cache

All infrastructure in Terraform, with **zero downtime on prod**.

## Decisions

| Decision          | Choice                                                                       | Why                                                                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compute           | Classic ECS Fargate + our own ALB                                            | ECS Express Mode's `aws_ecs_express_gateway_service` takes a single `primary_container` — no ADOT sidecar — and owns a shared ALB, which fights requirements 5, 7 and 8. |
| DNS               | Zones stay in `explorer-dev`; the prod pipeline writes records cross-account | Weighted shifting needs both records in one zone. Removes any dependency on the `vechain.org` zone owner during cutover.                                                 |
| Redis             | ElastiCache Serverless (Valkey), one per account, in phase 7                 | dev's is shared by dev + all previews; prod gets its own. Deferred until the ECS migration is done — see [Delivery](#delivery).                                          |
| Redis integration | Swap `async-cache-dedupe` storage to Redis in `lib/cached-proxy`             | Single swap point; also buys cross-pod request coalescing.                                                                                                               |
| ALB layout        | Two in `explorer-dev` — one for dev, one shared by previews                  | dev gets its own ALB, WAF and alarms, so it is a real rehearsal for prod. Preview ALB cost is flat regardless of open PR count.                                          |
| Metrics           | Infra **and** app metrics                                                    | Cache hit rate is the number that proves the Redis work paid off, and it is invisible today.                                                                             |
| Preview label     | One-way                                                                      | `labeled` deploys; removing the label is a no-op; teardown on PR close.                                                                                                  |

## Reference implementations

Two in-org repos already solve most of this. `agent-marketplace` is the closer and more mature
match — same shape (Next.js on ECS, two accounts, per-PR previews, AMP/AMG, WAF on ALB) — and its
comments cite the specific incidents behind each non-obvious line.

- [`vechain/agent-marketplace`](https://github.com/vechain/agent-marketplace) —
  `infra/terraform/{network,edge,frontend,frontend-preview,data,observability-*}`,
  `.github/workflows/{deploy,prepare-release,preview-frontend*}.yml`
- [`vechain/generic-delegator`](https://github.com/vechain/generic-delegator) — the
  `deploy.yml` → draft release → prod shape, and a vendored `ecs-loadbalanced-webservice` module

## Delivery

| Phase                 | Ends when                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| 0 — app changes       | `/api/health`, `/api/metrics`, the `node_env` fix and the preview label gate are on App Runner |
| 1 — dev foundations   | dev serves traffic on ECS at `dev.block-explorer.vechain.org`                                  |
| 2 — dev observability | Grafana shows app + infra metrics; a test alarm reaches Slack                                  |
| 3 — previews          | a labelled PR gets a working preview; teardown and reconcile both verified                     |
| 4 — shared pipeline   | merge to `main` deploys dev and leaves exactly one draft release                               |
| 5 — prod stack        | prod ECS serving on its ALB DNS name, still at DNS weight 0                                    |
| 6 — cutover           | weight at 100, App Runner deleted, dead Terraform removed                                      |
| 7 — shared cache      | dev and prod tasks share one Valkey; the hit-rate panel climbs on a task that did not fetch    |

Phase 0 splits into four independent PRs (health, metrics, `node_env`, preview label gate), none
of them interesting. Phase 6 is a runbook executed against live prod traffic, not a coding task —
keep it separate from phase 5.

**Redis lands last, after the cutover.** It is the one change that alters how the app serves
requests rather than where it runs, and folding it into the migration would mean debugging a
cache-coherency question and a platform question at the same time. Phases 1 and 5 therefore
provision no ElastiCache; phase 7 adds it to both accounts and does the app swap. Requirement 8
still holds, it is just the last thing delivered rather than the first.

## Target architecture

```
explorer-dev (891377394468)                    explorer-prod (471112836208)
──────────────────────────────                 ──────────────────────────────
Route53: block-explorer.vechain.org  ◄──────── prod pipeline writes here cross-account
         block-explorer-preview.vechain.org

ALB "dev"     ─► ECS svc dev      + ADOT       ALB "prod" ─► ECS svc prod  + ADOT
  + WAF                                          + WAF
ALB "preview" ─► ECS svc pr-N, pr-M, …
  host-header listener rules, no WAF

ElastiCache (Valkey) — dev + previews, phase 7      ElastiCache (Valkey) — phase 7
AMP + AMG + SNS ─► Slack, alerts OFF                AMP + AMG + SNS ─► Slack, alerts ON
observability-collector (YACE + ADOT) ─► AMP        observability-collector ─► AMP
```

Domains: prod `block-explorer.vechain.org`; dev `dev.block-explorer.vechain.org` (a record in the
existing prod zone — both live in `explorer-dev`, so no cross-account work); previews
`pr-N.block-explorer-preview.vechain.org` against the wildcard cert that already exists.

### Terraform layout

Replace today's two root modules (`account-level`, `frontend`) with a stack-per-directory layout
wired only through `terraform_remote_state`. Each stack owns its backend key;
`terraform.workspace` selects `dev`/`prod`. Keep the YAML env files the repo already uses rather
than adopting agent-marketplace's `locals.tf` ternaries — less churn, and greppable.

```
terraform/
  network/  ecr/  ecs/  acm/               foundations
  data/                                    ElastiCache                          (phase 7)
  edge/                                    dev|prod ALB, listeners, WAF, SGs, target group
  preview-edge/                            shared preview ALB + listener        (dev only)
  frontend/                                ECS service + task def + ADOT sidecar
  frontend-preview/                        per-PR TG + rule + service           (dev only, ws pr-N)
  observability-aws/                       AMP, AMG, SNS, Slack Lambda, rules, alarms
  observability-collector/                 YACE + ADOT standalone service
  observability-grafana/                   dashboards (needs the workspace first)
  modules/ecs-webservice/  modules/observability-sidecar/
```

Two deliberate departures from the reference:

- **Build a shared `modules/ecs-webservice`.** agent-marketplace hand-rolls seven near-identical
  task-definition/service blocks, and its `frontend-preview` has already drifted from `frontend`.
  We have exactly three shapes — dev, prod, preview — differing by parameters, not structure.
- **`terraform_data.workspace_guard`** on every stack
  (`contains(["dev","prod"], terraform.workspace)`), inverted to `can(regex("^pr-[0-9]+$", …))` in
  `frontend-preview`. Together these make it impossible to apply a preview into prod or a prod
  stack into a PR workspace.

Also adopt the `try(…, null)` + `count`-gate + `*_ready` local idiom for every cross-stack read,
so a parallel plan tolerates empty upstream state on a first deploy.

## Phase 0 — App changes

All safe on App Runner today and inert until the infrastructure exists. Landing them first is
what makes the cutover boring: by the time prod moves, the image running on ECS is one that has
already served prod traffic on App Runner for weeks.

### 0.1 Health endpoint — required, not optional

`app/api/health/route.ts`, returning a static 200. Two reasons this is a hard blocker:

- ALB target groups declare no `matcher`, so it defaults to `200`. Today's health path is `/`,
  which `i18nRouter` answers with a **307 to `/en`** — the target would never go healthy.
- `middleware.ts`'s matcher is `/((?!api|static|.*\..*|_next).*)`, so `/api/*` bypasses the i18n
  redirect entirely. `/api/health` is the only shape that returns a bare 200.

Keep the 200 independent of every cache and upstream — an outage must not cycle tasks.

### 0.2 Prometheus metrics

Add `prom-client` and `app/api/metrics/route.ts`. Instrument the one place everything funnels
through, `lib/cached-proxy/index.ts`: cache hit/miss/stale by `name` and `path`, upstream duration
and outcome (`NotFoundError` / `UpstreamError` / ok), and HTTP status by route.

Two contracts worth copying from agent-marketplace's async collectors:

- **Never await the network inside a collect callback.** Return a cached value and refresh in the
  background, so a wedged Thor node cannot stall `/metrics` on every replica at once.
- **A never-yet-successful read exports no series at all**, not a fake `0`. A fake zero trips the
  very alert it exists to make trustworthy.

Label HTTP metrics by the **matched route template**, never the raw path, so a prober cannot blow
up label cardinality.

**`/api/metrics` must not be publicly reachable.** In Fargate `awsvpc` mode the sidecar shares the
task's network namespace, so ADOT scrapes `127.0.0.1:3000/api/metrics` and the endpoint never
needs to cross the ALB. Add an ALB listener rule returning a fixed **403** for `/api/metrics`, at
a priority _below_ any future auth gate so it applies to authenticated users too — this mirrors
`aws_lb_listener_rule.backend_block_metrics` at priority 70 in agent-marketplace's `edge/main.tf`.
`/api/health` stays reachable; the ALB health check needs it and it leaks nothing.

Until that ALB rule exists the endpoint has nothing in front of it, so it is gated on a
`METRICS_ENABLED` env var that defaults off (on in development). Turn it on in the ECS task
definition, not on App Runner.

Two deviations found while building it. `async-cache-dedupe` fires `onHit` for a stale serve
exactly as for a fresh one and exposes no separate event, so `result` is `hit` / `miss` /
`dedupe`; the stale-refresh rate is `upstream_requests_total - cache_requests_total{result="miss"}`
instead. And the registry hangs off `globalThis`, because Next builds each route as its own entry
and a module-scope registry would leave the scrape seeing only its own copy.

### 0.3 Fix `node_env`

`terraform/environments/prod/prod.yaml` sets `node_env: prod`. The Dockerfile sets `production`,
and App Runner's `runtime_environment_variables` _replaces_ image `ENV` rather than merging — so
prod has been running with a `NODE_ENV` neither React nor Next recognises.
`preview.yaml.example` has it right.

Related footgun for every server env var this migration adds — `METRICS_ENABLED` now, `REDIS_URL`
in phase 7: `env.api.ts` carries a comment recording a prior outage where a module-load `throw` on
a missing var 500'd every route that imported it. **Every new server env var needs a safe
default.**

### 0.4 Gate previews on a label

Requirement 2, pulled forward: today every PR spins up an App Runner preview, so the waste is
happening now rather than after the migration. Gating the existing workflow costs nothing that
phase 3 then has to undo — the label logic ports to ECS unchanged, and landing it early means the
convention is established before previews move.

`deploy-preview.yml` gains `labeled` to its trigger types and a single `gate` job requiring
`create-preview`, replacing the `classify` → `gate-auto` / `gate-approval` → `gate` chain. The
label _is_ the human approval — applying one takes write access, the same bar the bot
classification enforced — which is what makes dropping that chain safe. Keep the fork exclusion.

- A `labeled` event fires for **any** label, so the guard needs
  `(github.event.action != 'labeled' || github.event.label.name == 'create-preview')` on top of
  the `contains(…labels.*.name, 'create-preview')` check, or every unrelated label redeploys.
- **`Deploy Preview Environment` has to come off `main`'s required status checks first.** A gated
  workflow never reports, so every unlabelled PR would sit unmergeable on a check that cannot
  arrive.
- `destroy-preview.yml` has no concurrency group at all today, so a teardown can run against the
  state an in-flight deploy holds. Give it deploy's group, `cancel-in-progress: false`.

The `preview-auto` and `preview-approval` GitHub Environments are left in place, unreferenced;
delete them whenever convenient. `preview-reconcile.yml` stays in phase 3 — it reaps orphaned
Terraform workspaces, which only exist once previews are on ECS.

## Phase 1 — Foundations in explorer-dev

Network (verify whether the account has a usable Control Tower VPC before building one), ECS
cluster, ACM cert for the dev domain, the dev ALB + WAF, and the dev ECS service with the ADOT
sidecar. No ElastiCache — that is phase 7.

**Enable Container Insights on the cluster.** Without it, the ECS task-count metrics, the
tasks-below-desired alarms and YACE's discovery all have nothing to read. (generic-delegator
deliberately _disables_ it and relies on the sidecar alone — a valid cheaper choice, but it costs
the outside-in alarms described in phase 2.)

Provision `INDEXER_RATE_LIMIT_BYPASS` in this account — see [Risks](#risks).

On the ALB, take agent-marketplace's two response-header settings: HSTS via
`routing_http_response_strict_transport_security_header_value`, and
`routing_http_response_server_enabled = false` to drop the `Server: awselb/2.0` banner.

## Phase 2 — Observability in explorer-dev

Two collectors, not one. The split is the part that is easy to get wrong:

- **`modules/observability-sidecar`**, injected into each app task. An `awsecscontainermetrics`
  receiver for per-task cgroup CPU/memory/network/disk, plus a `prometheus` receiver scraping
  `127.0.0.1:3000/api/metrics`. Mark it **`essential = false`** so a sidecar crash cannot restart
  the app. Set `app_port` — agent-marketplace's frontend omits it because Next.js has no
  `/metrics`, which is exactly the gap 0.2 closes.
- **`observability-collector`**, a standalone one-task service running **YACE + ADOT**. YACE is
  the CloudWatch→Prometheus bridge; it exists because the AWS ADOT distro ships no CloudWatch
  receiver. It is what gets ALB, WAF and ElastiCache metrics into the same Prometheus store as the
  app metrics.

  ALB and WAF metrics only at this point; the ElastiCache job arrives with the cache in phase 7.

Then AMP, AMG (Grafana 12.4, `CUSTOMER_MANAGED`, Okta SAML), the SNS topic and the SNS→Slack
Lambda. Dashboards go in a **separate stack**, because the Grafana provider cannot initialise
against a workspace it is also creating.

### Alerting

Every Prometheus threshold rule needs something inside the VPC still publishing; a failing task
cannot report its own failure, and the collector is a single task. So pair the AMP rules with
CloudWatch alarms on ALB `HealthyHostCount`, tasks-below-desired, and ALB 5xx.

Four details that are load-bearing and easy to break:

- `treat_missing_data = "breaching"` on outage alarms — `notBreaching` silences the alarm in the
  one case it exists for.
- `HealthyHostCount` must use **`Maximum`**, not `Minimum`. The metric is per-AZ, so `Minimum`
  false-fires on single-task services. (generic-delegator's `alb_healthy_hosts_low` uses
  `Minimum` — do not copy that one.)
- The SNS topic policy needs an explicit `AllowCloudWatchAlarmPublish` statement. The policy
  replaces the default account-owner policy, so without it every alarm delivers nothing, silently.
- Alarm descriptions must be written `Title — summary.` because the Lambda splits on the em dash.

`absent()` rules are the pipeline-liveness backstop, but note they do not fire at `for`: the
selector keeps resolving for `lookback_delta` (5m), so `for: 5m` pages at roughly 10m.

Set `alerts_enabled: false` for dev — metrics and dashboards on, paging off; nobody acts on a dev
page. The Slack webhook lives in a GitHub Environment secret → `TF_VAR_slack_webhook_url` →
Secrets Manager; an empty value writes a `placeholder` sentinel and the Lambda no-ops.

> **Open input:** which Slack channel. The webhook URL is opaque, so the target channel has to be
> supplied — it appears nowhere in either reference repo.

### WAF

A regional WAFv2 ACL attached straight to the ALB (no CloudFront). Rate-based IP rule at priority
10 **blocking from day one**; AWS managed groups (IpReputationList, AnonymousIpList,
CommonRuleSet, KnownBadInputsRuleSet) at 20–50 in **Count mode first**, flipped to block via a
variable once they have soaked.

Three constraints encoded in the logging config: the log group name must start `aws-waf-logs-`,
WAF rejects a log-group ARN carrying the `:*` suffix, and the log group should be created
**unconditionally** so disabling the WAF during a rule storm preserves forensics.

Use `data_protection_config` on the ACL rather than `redacted_fields` on the logging config —
`redacted_fields` does not cover sampled requests, so a false-positive match on an authenticated
request could expose a live token via `wafv2:GetSampledRequests`.

## Phase 3 — Previews on ECS

Model directly on agent-marketplace's `infra/terraform/frontend-preview/`. A `preview-edge` stack
owns the shared ALB and its HTTPS listener against the existing wildcard cert; a
`frontend-preview` stack is applied once per PR into workspace `pr-N` and creates a target group,
one host-header listener rule and an ECS service.

The vendored `ecs-loadbalanced-webservice` module **cannot** be reused here — it always creates
its own ALB and supports only `path_pattern` rules, no `host_header`.

Five details worth copying verbatim:

- **Priorities are a pure function of the PR number** — `2000 + pr_number`, with a variable
  validation against the 50000 ceiling. No allocator, no locking, no "find the next free
  priority" lookup. We need one rule per PR, not two, because there is no co-hosted API.
- **`depends_on = [aws_lb_listener_rule.frontend]` on the service.** ECS `CreateService` requires
  the target group to already be associated with a load balancer, and the only thing associating
  it is the rule's forward action — which the service has no implicit reference to. Without this,
  the first apply fails with _"target group … does not have an associated load balancer"_.
- **Target group names cap at 32 characters** — use a short form such as `be-fe-pr-${pr_number}`.
- **Pin every cross-stack read to `workspace = "dev"` explicitly.** Here `terraform.workspace` is
  `pr-N`, _not_ an environment, so an inherited-workspace remote-state read silently targets
  nothing.
- **`deployment_minimum_healthy_percent = 0`**, and **no** `ignore_changes = [task_definition]` —
  deliberately inverted from dev/prod, because the preview workflow re-applies with the head SHA's
  image on every push, so Terraform owning the task definition is what triggers the roll.

Ceiling on concurrent previews: **100 target groups per ALB, which AWS does not allow you to
raise.** Rules per ALB is also 100 but _is_ adjustable, so target groups binds first.

### Workflow changes

The label gate and the shared concurrency group both landed in [0.4](#04-gate-previews-on-a-label),
so what is left here is repointing `deploy-preview.yml` and `destroy-preview.yml` from the App
Runner service at the `frontend-preview` stack and its `pr-N` workspace. The gate job itself
carries over unchanged.

**Add `preview-reconcile.yml`** (cron every 6 hours). This is not optional once there is a label
gate. Event-driven teardown genuinely misses cleanups: a queued teardown can be silently evicted
from the shared concurrency group when a newer run supersedes it (the direct cost of
`cancel-in-progress: false` above), a `destroy` can fail on a throttle or a lock, and a long-lived
labelled PR sits forever.

The sweep lists `pr-*` Terraform workspaces — the workspace list is the source of truth, not tags
or an ECS listing — and reaps any whose PR is closed or unlabelled. Copy all four safety
properties: **skip on any query failure** (leak one more cycle rather than destroy a live
preview), **re-confirm immediately before destroying**, **treat already-gone as reaped rather than
failed**, and **error-isolate each reap** so one stuck workspace cannot starve the rest under
`set -e`.

> agent-marketplace runs previews on the **dev** ALB rather than a second one, relying on an
> "every listener rule must pin a host condition" convention for isolation. A separate preview ALB
> costs roughly $18/month more but keeps previews off dev's WAF rate limits. Easy to collapse into
> one later if the cost is unwelcome.

## Phase 4 — Shared deploy pipeline

Replace `deploy-production.yml` with a single `deploy.yml` deriving its target from the trigger:
tag push → dev, `release: published` → prod, `workflow_dispatch` → either (break-glass). Add
`prepare-release.yml` to cut the draft release after a successful dev deploy. The shared
`vechain/github-actions-public` semantic-versioning workflow already produces the `v.X.Y.Z` tag on
merge, so the trigger already exists.

Dev and prod deploy the **same image**, so parity is structural rather than maintained by hand.

Things to take from the reference:

- **Verify the tagged commit is an ancestor of `origin/main`** before deploying. This is the
  single highest-value item here: without it, anyone with push access to any branch can trigger a
  credentialed prod deploy of unreviewed code by pushing a `v*` tag.
- **`vars.AWS_OIDC_ROLE_ARN` scoped per GitHub Environment** — one variable name, two values, no
  `if env == prod` conditional anywhere. Prod approval is a GitHub Environment protection rule.
- **An ordered `TF_MODULES` list** for apply ordering, planned in parallel as a matrix then applied
  serially. The apply step must **re-plan** each stack rather than trusting the fan-out result: an
  upstream apply changes a `terraform_remote_state` output that a downstream plan only then sees.
  Do not pass the binary plan file between jobs — it can carry sensitive state.
- **`prepare-release.yml` filters on `workflow_run.event == 'push'`**, which is what stops the prod
  deploy from cutting another draft in an infinite loop. It deletes stale drafts so there is
  exactly one "publish me" button, and sets `--notes-start-tag` to the last _published_ release,
  because GitHub's default baseline picks the previous dev-only tag.
- **`--task-definition <family>` on `aws ecs update-service`** is load-bearing wherever
  `ignore_changes = [task_definition]` is set: Terraform registers a new revision but does not move
  the service pointer, so without the flag `--force-new-deployment` redeploys the frozen revision.
- The `|| 'default'` idiom on every `TF_VAR_*` sourced from a GitHub var. An unset var interpolates
  to `""`, which is _set-to-empty_, not unset, so the Terraform default never applies and non-string
  types raise a type error.

Worth adding while we are here: the org's `checkov.yaml` and `action-lint.yaml` reusable
workflows, plus a single `if: always()` aggregator job so branch protection needs one entry rather
than a name per matrix shard.

## Phase 5 — Prod in explorer-prod

Bootstrap the account: state bucket, GitHub OIDC provider, a scoped deploy role, ECR, network,
cluster, ALB, WAF, ECS service, and observability with `alerts_enabled: true`. Plus the
cross-account role in `explorer-dev` that lets the prod pipeline UPSERT Route53 records.

Scope the OIDC role properly rather than reaching for the shared `github-actions-role`. The
reasoning in generic-delegator's `terraform/oidc-roles.tf` applies verbatim: the shared role
trusts `repo:vechain/<name>:*`, so a workflow on any branch of any trusted repo can assume it, and
it grants `*` on `*`.

## Phase 6 — Cutover

Both records must live in one hosted zone for weighted routing, which is why
`block-explorer.vechain.org` stays in `explorer-dev`. Route53 alias records can target an ALB in
another account — supply `DNSName` + `CanonicalHostedZoneId` rather than picking from a dropdown —
and the ACM certificate issued in `explorer-prod` validates via a CNAME written into the
`explorer-dev` zone. ACM does not care which account hosts the zone.

### The one genuinely dangerous step

`terraform/frontend/route53.tf` declares the domain as a **simple** A-alias. Adding
`set_identifier` + `weighted_routing_policy` **forces replacement**, and Terraform does
destroy-then-create as two API calls — a real window with no record at all.

Do the conversion as a single atomic change batch instead:

```
DELETE  block-explorer.vechain.org  A  ALIAS -> App Runner   (simple)
CREATE  block-explorer.vechain.org  A  ALIAS -> App Runner   (weighted, weight 100, id "app-runner")
CREATE  block-explorer.vechain.org  A  ALIAS -> prod ALB     (weighted, weight 0,   id "ecs-prod")
```

Route53 documents this as transactional — _"Route 53 validates the changes in the request and then
either makes all or none of the changes in the change batch request"_ — and its own example is
exactly a delete-plus-create-alias on one name. Then `terraform import` both records and update
`route53.tf` to match.

### Shift, then decommission

`0 → 10 → 25 → 50 → 75 → 100`, validating against the Grafana dashboards and the ALB alarms at
each step. Set `evaluate_target_health = true` on the ALB record so a failed prod stack drops out
of rotation on its own. Rollback at any point is a weight change. Hold App Runner at weight 0 for
**24–48 hours** per AWS guidance before deleting anything.

Then delete the App Runner service and its custom-domain association, and remove
`terraform/frontend/app_runner.tf`, `data.aws_apprunner_hosted_zone_id`, both
`aws_apprunner_auto_scaling_configuration_version` resources, and the App Runner instance and
access IAM roles from `terraform/account-level/`.

## Phase 7 — Shared cache

Only now, with both environments settled on ECS and the cache hit rate already on a dashboard from
phase 0's metrics. All server-side caching today is process-local: `async-cache-dedupe` for
positive results, `lru-cache` for negative ones, instantiated at module scope per route. With prod
at up to 10 instances that is up to 10 divergent caches, cold on every deploy.

### Infrastructure

A `data/` stack per account holding ElastiCache Serverless Valkey with an RBAC user group
(agent-marketplace's `infra/terraform/data/main.tf` is the template — a disabled `default` user
plus a scoped app user). dev's instance is shared by dev and every preview; prod gets its own.

Add the ElastiCache job to `observability-collector` at the same time. **Specific trap:** YACE
v0.65 discovery _silently NaNs_ `:serverlesscache:` ARNs. Our Valkey has to go in a `static[]`
block, and static jobs use the legacy `GetMetricStatistics` API, which skips the metric entirely
on a nil result — so set `length: 300`, not 60.

### The app swap

One swap point — `lib/cached-proxy/index.ts`, `storage: { type: 'memory', … }` → `type: 'redis'`
with an injected `ioredis` client, gated on `REDIS_URL` so it stays in-memory locally and in tests.

**Serverless Valkey runs in cluster mode**, so the client is `new Redis.Cluster(...)` over
`rediss://`. Mirror agent-marketplace's `REDIS_URL` + `REDIS_CLUSTER_MODE` pair.

Cluster mode is safe here, and it is worth recording why. `async-cache-dedupe`'s Redis storage
_does_ issue cross-key `pipeline()` batches, which would fail with `CROSSSLOT` — but every one of
them sits inside an `if (this.invalidation)` branch. `invalidation` defaults to `false`, and
`cached-proxy` is a pure TTL cache that never calls `invalidate()`, so `get` / `set` / `exists` /
`pttl` are all single-key. Add a `{be}` hash-tag prefix anyway, plus a comment: turning
invalidation on without one is precisely what bit agent-marketplace's Langfuse keys.

Two more things the swap needs:

- **Negative caches are separate `LRUCache` instances** with no Redis path in the library.
  Hand-port to `SET k 1 EX ttl` / `EXISTS` — single-key, cluster-safe. Mind the unit mismatch:
  `async-cache-dedupe` TTLs are seconds, `LRUCache` takes milliseconds.
- **Prefix keys with the build ID.** The namespaces (`indexer_transactions_latest`,
  `thor_blocks_best`, …) are stable across releases, so without a prefix a schema change would
  serve stale-shaped payloads to a new build out of a now-shared cache.

The response-dependent TTL in `lib/thor-cache/index.ts` (10s, or 600s once `isFinalized`) is a
function TTL — confirm the Redis backend honours it during implementation.

Roll it out to dev first and leave it there for a week. Because the swap is gated on `REDIS_URL`,
rollback is unsetting one variable, not a redeploy of old code.

## Risks

| Risk                                   | Detail                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Indexer rate limiting**              | ECS tasks in private subnets egress through a NAT gateway, so _all_ server-side indexer traffic collapses onto one or three IPs; App Runner gives varying public IPs today. `INDEXER_RATE_LIMIT_BYPASS` is currently **prod-only** by deliberate choice and becomes load-bearing for dev and previews. Provision it in `explorer-dev` before dev takes traffic, or expect 429s. |
| **`force-dynamic` on the root layout** | `app/[locale]/layout.tsx:35` propagates to every child, so the `revalidate` values on the homepage, block, transaction, address and NFT pages are all inert — every page is server-rendered per request with no full-route cache. It is why `/api/*` carries the entire load. This changes how we size Fargate tasks, and deserves its own ticket.                              |
| **Build-time indexer URLs**            | `NEXT_PUBLIC_VEWORLD_INDEXER_{MAINNET,TESTNET}_URL` are baked at build time (`env.public.ts`) but read **server-side** by `lib/indexer-cache`. Repointing the indexer needs an image rebuild, not a redeploy. Not blocking unless the indexer moves.                                                                                                                            |
| **Middleware behind a proxy**          | `middleware.ts` builds redirect targets with `new URL(newPath, request.url)`. Test the legacy `/account/0x…` and `/accounts/0x…` 308s end-to-end after cutover.                                                                                                                                                                                                                 |
| **Open image proxy**                   | `next.config.ts` sets `images.remotePatterns` to `hostname: '**'` — any HTTPS host. Worth tightening while we are adding a WAF; its on-disk optimizer cache is another per-pod ephemeral store.                                                                                                                                                                                 |
| **Node 20 EOL April 2026**             | `node:20.19.0-alpine`. Fold the bump into this work rather than doing it twice.                                                                                                                                                                                                                                                                                                 |
| **Dead config**                        | `NEXT_PUBLIC_NETWORK` and `NEXT_PUBLIC_PREVIEW` are set in both env YAMLs and read **nowhere**. `min_size`, `max_size`, `max_concurrency` and `region` are equally inert — the real autoscaling lives in `terraform/account-level/autoscaling.tf`. Drop them rather than porting them.                                                                                          |
| **No state locking**                   | Neither `backend.config` sets `dynamodb_table`, and no workflow passes a second `-backend-config`, despite `provider.tf` and `DEPLOYMENT.md` both claiming otherwise. Set `use_lockfile = true` on every new backend.                                                                                                                                                           |
| **Architecture**                       | `publish-ghcr-image.yml` already builds multi-arch on `ubuntu-24.04-arm`; the preview ECR build is amd64-only. Standardise on **arm64** Fargate (~20% cheaper) and have previews promote from GHCR rather than rebuilding.                                                                                                                                                      |
| **Stale docs**                         | `.github/workflows/README.md`, `DEPLOYMENT.md` and both Terraform `README.md`s describe workflows, buckets and sizing that no longer exist. `CLAUDE.md` mentions Terragrunt, which this repo has never used. Rewrite in the final phase.                                                                                                                                        |

## Verification

- **Health** — `curl -f https://<env>/api/health` returns 200 with no redirect; the ALB target
  group reports healthy within the deployment window.
- **Metrics are private** — `curl https://<env>/api/metrics` returns 403 from the ALB, while the
  sidecar's scrape succeeds (series present in AMP).
- **Cache is genuinely shared** (phase 7) — scale dev to two tasks, hit
  `/api/indexer/transactions/latest` repeatedly, and confirm the hit counter climbs on the task
  that did _not_ do the upstream fetch. That is the proof Redis replaced per-pod caching.
- **Rendering** — walk `/`, a block, a transaction, an address and an NFT page in two locales
  through the ALB; confirm the i18n redirect and the legacy `/account/0x…` 308 both work.
- **WAF** — exceed the per-IP limit and confirm a 429, the entry in the WAF log group, and the
  Grafana WAF panel. Confirm managed-rule findings appear as **Count**, not Block, before flipping.
- **Alerting** — stop the dev service and confirm the unhealthy-hosts alarm reaches Slack and then
  recovers. Confirm an alarm description renders as `Title — summary.` in the message.
- **Previews** — open a PR, add `create-preview`, confirm the deploy; add an unrelated label and
  confirm **no** redeploy; close the PR and confirm teardown; run the reconcile workflow manually
  against a deliberately-orphaned workspace.
- **Terraform** — `terraform plan` is clean immediately after every apply, in every workspace.
