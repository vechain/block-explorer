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
| `account-level/`         | Legacy: ECR, the Route53 zones and the certs previews still use      |

`modules/ecs-webservice` is the shared Fargate service shape — dev, prod and previews differ by
parameters, not structure. It holds two copies of the service resource because `ignore_changes` takes
only a literal: dev and prod need it on `task_definition` (their deploy workflow moves the pointer out
of band), previews need it off (the apply itself is what rolls them). `terraform_owns_task_definition`
picks one. It also owns the target-tracking policies, which are off unless `autoscaling_max` is set in
the env YAML — previews stay at one task.

`modules/observability-sidecar` renders the ADOT container that scrapes `/api/metrics` over the task's
loopback; previews do not carry it.

`account-level/` is what is left of the App Runner setup: the ECR repository, both public zones and
the wildcard certificate `preview-edge/` reads. It is applied by hand, not by a pipeline.

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

`dashboards/logs.json` reads the ECS task log group through CloudWatch Logs Insights, which bills on
bytes scanned, so it ships with auto-refresh off. All WAF panels now sit on the overview: the metric
ones answer how much and which rule, and a collapsed Logs Insights row answers who and what. Collapsed
matters — the overview refreshes every minute, and those queries only run while the row is open.

The WAF metric panels name each rule explicitly: the `Rule` dimension carries the `visibility_config`
metric name, and a wildcard also matches the `ALL` aggregate and the managed groups' nested sub-rules,
which double-counts. `CountedRequests` overlaps `AllowedRequests` for the same reason — a count-mode
match does not terminate evaluation — so the two never belong in one stack.

`alerts_enabled` in the env YAML turns alerting on, and dev has it off — no CloudWatch alarms, no AMP
alert rule group, no Alertmanager definition, and Grafana's Alerting UI is not wired to any of them.
Nobody acts on a dev page, and dev is hibernated often enough that alarms there would read as
permanently red. The recording rules are separate and always built, because the dashboards query them.

So is the delivery path — topic, bridge Lambda and webhook secret — which costs nothing idle and is
what keeps re-enabling a one-line flip rather than a wait on that secret's seven-day recovery window.
To rehearse end to end: set the `SLACK_WEBHOOK_URL` secret on the `dev` GitHub Environment, flip
`alerts_enabled` to `true`, deploy, scale the service to zero, and confirm the no-healthy-targets
alarm arrives and then recovers.

The cost of dev not evaluating the AMP rules is that **prod is now the first apply to parse a new
one** — `aws_prometheus_rule_group_namespace` is what validates the YAML and its PromQL, server-side.
Rehearsing in dev before touching `alert_rules_yaml` is the cheap way round it.

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

## Autoscaling

`modules/ecs-webservice` holds the service at two target-tracking policies at once, and the pairing
is the point. CPU leads, because every page is server-rendered per request and load shows up there
before it shows up as queueing. But the metric is a service _average_, and a task that is booting or
being replaced contributes near-zero CPU to it — so the average reads low exactly when the service is
failing. On 2026-08-28 that inverted the controller: it scaled prod in to 5 tasks and then 4 while
p99 sat at 22s and one host was healthy.

Requests per target moves the other way. When targets drop out the surviving ones each take a larger
share, so the metric rises through the same failure that pushes average CPU down. Application Auto
Scaling scales out on whichever policy asks for more and scales in only when both agree, which leaves
CPU leading in normal conditions and stops it shedding capacity during a brownout.

The request-count policy needs the ALB it is measured against, passed as
`autoscaling_request_count_resource_label`; without one, CPU is the only signal. That is a separate
switch from `autoscaling_max`, which is what turns target tracking on at all — previews set neither,
so they run no autoscaling and stay at one task.

## Environment config

Per-environment values live in `environments/<env>/<env>.yaml` and are read with `yamldecode`, so
stacks carry no `workspace == "prod" ? … : …` ternaries. The state bucket for each environment is in
`environments/<env>/backend.config`, and the stacks that read another stack's state read that file
back rather than defaulting to a bucket name — the two environments are in different accounts, so a
prod apply that fell through to dev's bucket would quietly read dev's network and skip dev's cache.

Because the YAML path is derived from `terraform.workspace`, anything outside `dev` / `prod` fails at
parse time — and every stack additionally carries a `workspace_guard` precondition.
`environments/preview/preview.yaml` is the exception: previews are not a workspace, so `preview-edge`
reads it from a fixed path while applying into `dev`.

To validate without a backend, set the workspace through the environment:

```bash
TF_WORKSPACE=dev terraform validate
```

## Applying

`deploy.yml` owns everything long-lived in `explorer-dev`, `preview-edge` included. Every merge to
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

Same stacks, a second account, and a separate state bucket — the same `deploy.yml` applies them on
`release: published`, less `preview-edge` and `dns`, which exist only in the dev account. Prod's
ElastiCache is built with the account rather than retrofitted, so the image that eventually takes
prod traffic is one that has been running against Valkey in dev for weeks.

Both public zones stay in the dev account, which is what let the cutover's weighted pair live in one
zone, and is still where `block-explorer.vechain.org` resolves from. So
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
   Prod proxies the indexer server-side, so every call leaves from the NAT EIPs and needs it.

Prod Grafana has no SAML until an Okta app exists for its workspace: an AMG workspace is its own SAML
audience, so dev's app cannot serve both. Alerts still reach Slack, and dashboards still provision,
since the Terraform provider uses a service-account token.

### The records on the prod domains

`block-explorer.vechain.org` and `explore.vechain.org` each carry a weighted A-alias with set
identifier `ecs-prod`, left over from the cutovers: each shared its name with an `app-runner` record
until App Runner was deleted. Each is the only record on its name now, and the weight is a formality —
`edge/` keeps it because dropping `dns_weight` would replace the record for no gain.

Worth remembering the next time prod has to move. Two weighted records on one name, ramped with an
UPSERT per step, made rollback a weight change rather than a revert, and `evaluate_target_health` took
a failing origin out of rotation unattended. Four things about the shape itself.

Terraform cannot turn a simple record into a weighted one. Route53 rejects a weighted record created
beside a simple one of the same name, and the provider offers no path between them, so the apply
fails outright. `block-explorer.vechain.org` got its first weight from a stack that already owned the
record; `explore.vechain.org` needed a manual `change-resource-record-sets` batch deleting the simple
record and creating both weighted ones in one transaction.

Run that batch before the **merge**, not before the release. A merge to `main` cuts a release and the
deploy chains straight off it, so there is no gap in which to do it — skipping it fails the prod
deploy at `edge/` and skips every stack after it.

A single apply is not atomic across two records either. The provider sends one Route53 change per
record, so an interrupted apply leaves the weights mismatched. Read both back after every write.

And freeze releases for the length of the ramp. Neither record ignores changes to its weight, so a
release lands the yaml's numbers over whatever the ramp has reached.

Size the origin before ramping, not after. App Runner served `explore.vechain.org` on four to eight
instances of 2 vCPU; prod ECS started the ramp at dev's 512/1024 and pinned at 100% CPU the moment the
name landed on it.
