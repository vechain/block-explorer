# Terraform

One stack per directory, wired together only through `terraform_remote_state`. Each stack owns its
own S3 state key; `terraform.workspace` selects the environment (`dev` / `prod`).

## Layout

| Stack                    | Owns                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `bootstrap/`             | Prod only, by hand: the deploy role, ECR (see below)                 |
| `dns/`                   | Dev only: the role the prod pipeline assumes to write records        |
| `network/`               | VPC, three subnet tiers, NAT, S3 gateway endpoint                    |
| `ecs/`                   | ECS cluster (Container Insights on)                                  |
| `acm/`                   | Public certificate for the environment's domain, DNS-validated       |
| `edge/`                  | ALB, listeners, target group, security groups, WAF, DNS record       |
| `preview-edge/`          | Shared preview ALB, listeners, security groups, wildcard DNS record  |
| `data/`                  | ElastiCache Serverless Valkey, its RBAC users and the URL secret     |
| `frontend-preview/`      | One PR's target group, host-header rule and ECS service              |
| `observability-aws/`     | AMP, Grafana, SNS, the Slack bridge, AMP rules and CloudWatch alarms |
| `frontend/`              | The explorer's ECS service, task definition and secret               |
| `observability-grafana/` | Grafana datasources and dashboards                                   |
| `account-level/`         | Legacy: ECR, Route53 zones, App Runner IAM and autoscaling           |
| `app-runner/`            | Legacy: the App Runner service still serving prod                    |

`modules/ecs-webservice` is the shared Fargate service shape — dev, prod and previews differ by
parameters, not structure. It holds two copies of the service resource because `ignore_changes` takes
only a literal: dev and prod need it on `task_definition` (their deploy workflow moves the pointer out
of band), previews need it off (the apply itself is what rolls them). `terraform_owns_task_definition`
picks one. It also owns the CPU target-tracking policy, which is off unless `autoscaling_max` is set in
the env YAML — previews stay at one task.

`modules/observability-sidecar` renders the ADOT container that scrapes `/api/metrics` over the task's
loopback; previews do not carry it.

The two legacy stacks are removed once prod has moved to ECS. `app-runner/` was named `frontend/`
until the ECS work started; its state key is declared in `provider.tf` and is still
`frontend/terraform.tfstate`, so the rename moved no state.

## Observability

Metrics land in two stores, split by who publishes them. What the app knows about itself — cache
hits, upstream outcomes, HTTP status, plus per-task cgroup CPU and memory — goes to AMP, collected
by `modules/observability-sidecar` riding in each app task. What AWS knows about our resources —
ALB, ECS, WAF and the shared cache — stays in CloudWatch and is alarmed there.

A standalone YACE task bridging CloudWatch into AMP was tried and removed: it put every AWS-side
metric behind one Fargate task that could itself die, to buy a single query language nothing here
needed. Keep the split when prod is stood up. The SNS → Lambda → Slack bridge renders a CloudWatch
alarm into the same shape as an Alertmanager notification, so it is invisible to whoever is on call.

Dashboards live in `observability-grafana/` as a separate stack because the Grafana provider cannot
initialise against a workspace the same apply is creating. The alert rules deep-link to panel IDs in
`dashboards/overview.json` — renumbering a panel breaks the link from Slack.

Alerts evaluate in every environment but `alerts_enabled` in the env YAML controls whether they are
delivered, and dev has it off. To rehearse the path end to end: set the `SLACK_WEBHOOK_URL` secret on
the `dev` GitHub Environment, flip `alerts_enabled` to `true`, scale the service to zero, and confirm
the no-healthy-targets alarm arrives and then recovers.

Grafana sign-in is Okta SAML, configured from `grafana_okta_saml_metadata_url` and the two
`grafana_*_okta_groups` lists in the env YAML. Blank the URL, or leave the Admin list empty, and the
workspace stays without a SAML configuration — AMG rejects an empty role-value list, so there is no
sign-in-but-nobody-mapped state to land in. Both lists need at least one group. Dashboards provision either way, since the Terraform
provider authenticates with a service-account token rather than through SAML. A user whose `role`
assertion matches neither list is a Viewer.

## Shared cache

`data/` holds one ElastiCache Serverless Valkey per account, and in dev it is shared by dev and every
preview. The app reads it through `REDIS_URL`, injected from a Secrets Manager secret the stack
writes: with the secret absent every proxy cache stays in-process, per task and cold on each deploy,
which is how the environment behaves before this stack is applied and how it behaves again if the
variable is removed. Rollback is dropping one environment variable, not a redeploy of old code.

Keys are prefixed with the image tag, so two builds sharing one cache cannot read each other's
payloads — that is what lets a preview running unmerged schema changes share dev's instance. It also
means a deploy starts cold: the entries worth sharing are the day-long ones, decoded selectors and
Sourcify ABIs, and they are rebuilt per release rather than carried across.

## Environment config

Per-environment values live in `environments/<env>/<env>.yaml` and are read with `yamldecode`, so
stacks carry no `workspace == "prod" ? … : …` ternaries. The state bucket for each environment is in
`environments/<env>/backend.config`, and the stacks that read another stack's state read that file
back rather than defaulting to a bucket name — the two environments are in different accounts, so a
prod apply that fell through to dev's bucket would quietly read dev's network and skip dev's cache.
`app-runner/` is the exception: it pins the old bucket in its own `provider.tf`, because
`environments/prod/backend.config` now names the new account's.

Because the YAML path is derived from `terraform.workspace`, anything outside `dev` / `prod` fails at
parse time — and every stack additionally carries a `workspace_guard` precondition.
`environments/preview/preview.yaml` is the exception: previews are not a workspace, so `preview-edge`
reads it from a fixed path while applying into `dev`.

To validate without a backend, set the workspace through the environment:

```bash
TF_WORKSPACE=dev terraform validate
```

## Applying

`deploy-dev.yml` owns everything long-lived in `explorer-dev`, `preview-edge` included. Every merge to
`main` gets a `v.X.Y.Z` tag, which builds the release image; the deploy chains off that build, pins
`image_tag`, applies the stacks in order and rolls the ECS service. Nothing here needs applying by
hand.

The preview ALB sits in that list rather than in `deploy-preview.yml` because it is shared and must
only change from merged code — a preview deploy runs the PR's own branch, so applying it there would
let any labelled PR reshape the ingress every other preview is served through.

Order matters where a stack reads another's state, and the workflow applies them serially in it:
`dns` → `network` → `ecs` → `acm` → `edge` → `preview-edge` → `data` → `observability-aws` →
`frontend` → `observability-grafana`. `frontend` sits after the AMP workspace because its sidecar remote-writes to
it; `observability-aws`'s alarms name the ECS service by convention rather than reading it back, which
is what keeps that from being a cycle. To run one stack locally against dev:

```bash
cd terraform/network
terraform init -backend-config=../environments/dev/backend.config
terraform workspace select -or-create dev
terraform plan
```

`.terraform/` is per-directory, so `init` and the workspace selection are needed in each stack.
`terraform validate` needs a workspace too, but no backend — use `TF_WORKSPACE=dev terraform validate`.

`frontend-preview` is the exception to all of the above: it is applied once per PR into workspace
`pr-<N>`, by `deploy-preview.yml` on the `create-preview` label. Never apply it by hand — the state
lives at `env:/pr-<N>/frontend-preview/terraform.tfstate` and the workspace list is what
`preview-reconcile.yml` sweeps, so a workspace created outside the workflow is a preview nothing owns.
Concurrent previews cap at 100, the target-group-per-ALB quota AWS does not raise.

State locking is via S3 conditional writes (`use_lockfile = true`), not DynamoDB — no lock table
exists for these stacks, and none is needed.

One thing the pipeline deliberately does not do: **set the indexer bypass token.** It is seeded blank,
because the app treats blank as unset and sends no header — so a wrong token is never sent. Put the
real value into the secret named in the `indexer_rate_limit_bypass_secret_arn` output, then re-run the
deploy, since secrets are injected only when a task starts. Skipping this does not break health
checks; it means every server-side indexer call leaves from the one NAT IP and takes the indexer's
per-IP rate limit for the whole environment.

## Prod

Same stacks, a second account, and a separate state bucket — `deploy-prod.yml` applies them on
`release: published`, less `preview-edge` and `dns`, which exist only in the dev account. Prod's
ElastiCache is built with the account rather than retrofitted, so the image that eventually takes
prod traffic is one that has been running against Valkey in dev for weeks.

**The domain is not part of this.** `dns_record_enabled` is false in `prod.yaml`, so nothing here
touches `block-explorer.vechain.org` — it resolves to App Runner, and the new stack is reachable only
by its ALB name, which is what the deploy verifies against with `curl --connect-to`. Turning it into a
weighted pair is the cutover — see below.

Both public zones stay in the dev account, which is what lets that weighted pair live in one zone. So
`acm/` and `edge/` write records through a second provider that assumes the role `dns/` owns there,
and `bootstrap/` grants the deploy role nothing on Route53 in its own account.

Standing up the account, in order:

1. Create the state bucket and apply `bootstrap/` by hand — see [bootstrap/README.md](bootstrap/README.md).
2. Set `AWS_OIDC_ROLE_ARN` on the `prod` Environment to that stack's `gha_role_arn`, and
   `PROD_DEPLOY_ROLE_ARN` on `dev` to the same value. Neither is committed: they carry account ids,
   and this repo is public.
3. Merge, so the next dev deploy applies `dns/` and creates the cross-account role. Set its
   `dns_writer_role_arn` output as `DNS_WRITER_ROLE_ARN` on the `prod` Environment.
4. Publish a release. Expect the first apply to surface a missing IAM action or two; that is what the
   scoped role costs.
5. Put the real indexer token into `block-explorer/prod/indexer-rate-limit-bypass` in the new account.
   `BYPASS_INDEXER_PROXY` is on in prod, so nothing needs it yet — it is what lets that flag be
   dropped later.

Prod Grafana has no SAML until an Okta app exists for its workspace: an AMG workspace is its own SAML
audience, so dev's app cannot serve both. Alerts still reach Slack, and dashboards still provision,
since the Terraform provider uses a service-account token.

### Cutover

`block-explorer.vechain.org` becomes a weighted pair — `app-runner` and `ecs-prod` — and traffic moves
by weight. Both `edge/` and `app-runner/` grow a `weighted_routing_policy` when their env yaml carries
a weight (`dns_weight`, `app_runner_dns_weight`). With no weight set they stay simple records, so dev
never sees any of this.

The two sides have to be enabled by **separate releases**, because a `release: published` starts
`deploy-prod.yml` and `deploy-production.yml` at the same time and Route53 rejects a weighted record
created next to a simple one of the same name. In that order the App Runner side goes first:

1. **`app_runner_dns_weight: 100`, then publish a release.** Nothing moves — one record still holds
   all the traffic, it just expresses that as a weight now. The provider turns the simple record into
   a weighted one as a delete-plus-create inside a single Route53 change batch, which Route53 applies
   transactionally, so the name never stops resolving. Confirm the record came back weighted before
   going on; a `terraform plan` of `app-runner/` is clean either way, since the resource id it writes
   already carries the set identifier.

2. **`dns_record_enabled: true` and `dns_weight: 0`, then publish another release.** `edge/` adds
   `ecs-prod` beside it — a plain create, the name being weighted already. Still nothing moves.

3. **Ramp** `0 → 10 → 25 → 50 → 75 → 100`, holding at each step for the Grafana dashboards and the ALB
   alarms. Each step is an UPSERT of both records; rollback is the same call with the old numbers,
   which is why the ramp is not driven by an apply. `evaluate_target_health` on the ECS record means a
   prod stack that fails its health checks leaves rotation without anyone making that call. Put the
   final weights back into the yaml when the ramp settles, so an apply agrees with the zone.

4. **Hold App Runner at weight 0 for 24–48 hours**, then decommission it.
