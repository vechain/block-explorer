# Terraform

One stack per directory, wired together only through `terraform_remote_state`. Each stack owns its
own S3 state key; `terraform.workspace` selects the environment (`dev` / `prod`).

## Layout

| Stack                    | Owns                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `bootstrap/`             | By hand, per account: the deploy role, ECR (see below)                   |
| `dns/`                   | Dev only: the role the prod pipeline assumes to write records            |
| `cdn/`                   | Bundle and log buckets, CloudFront, the routing function, its store, WAF |
| `observability-aws/`     | AMP, Grafana, SNS, the Slack bridge and the CloudWatch alarms            |
| `observability-grafana/` | Grafana datasources and the overview dashboard                           |
| `account-level/`         | Legacy: ECR, the Route53 zones and the preview wildcard certificate      |

`account-level/` is what is left of the App Runner setup: the ECR repository, both public zones and
a wildcard certificate. Nothing in the pipeline reads it; it is applied by hand.

The ECS stacks — `network`, `ecs`, `acm`, `edge`, `preview-edge`, `data`, `frontend`,
`frontend-preview` and the two modules under `modules/` — were deleted once both environments had
served from CloudFront for a release. Their state keys stay in the buckets as a record.

Two things about that teardown, either of which turns a destroy into an outage:

- The prod ALB carried `enable_deletion_protection`, so `edge/` had to be applied once with it off
  before it would destroy.
- `acm/` and `cdn/` own the _same_ Route53 validation records. ACM reuses one CNAME per domain per
  account, which is why `cdn/certificate.tf` sets `allow_overwrite`. Destroying `acm/` therefore
  deletes the records the live CloudFront certificate renews against, silently and about a year
  ahead of when it would bite. Re-apply `cdn/` immediately after.

## Observability

Everything on the serving path is an AWS metric now, so it is all CloudWatch and it is all alarmed
natively. CloudFront and its Web ACL publish only to **us-east-1** whatever region the stack runs
in, which is why `observability-aws/` carries a second provider and a second SNS topic: a CloudWatch
alarm can act only on a topic in its own region. One bridge Lambda serves both — SNS delivers
cross-region to Lambda, so the eu-west-1 function is subscribed to the us-east-1 topic.

The AMP workspace survives with no writer. Nothing remote-writes to it since the ECS sidecar went,
and Grafana keeps the datasource wired so a client-side path has somewhere to land; `manageAlerts`
is off, because there is no rule group to surface. The recording rules, the AMP alert rules and the
Alertmanager definition went with the sidecar — they queried series that will never arrive again,
which is coverage that reads as real and is not.

The SNS → Lambda → Slack bridge renders a CloudWatch alarm into the same shape as an Alertmanager
notification, so it is invisible to whoever is on call. Alarm descriptions must read
`Title — summary.`: the Lambda splits on the em dash.

Dashboards live in `observability-grafana/` as a separate stack because the Grafana provider cannot
initialise against a workspace the same apply is creating.

`dashboards/overview.json` reads CloudFront, its viewer-request function, its key value store and
its WAF. A collapsed Logs Insights row at the bottom answers who and what — collapsed matters,
because the overview refreshes every minute and those queries only run while the row is open.

The WAF metric panels name each rule explicitly: the `Rule` dimension carries the `visibility_config`
metric name, and a wildcard also matches the `ALL` aggregate and the managed groups' nested sub-rules,
which double-counts. `CountedRequests` overlaps `AllowedRequests` for the same reason — a count-mode
match does not terminate evaluation — so the two never belong in one stack. Note also that a
CLOUDFRONT-scope Web ACL publishes **no `Region` dimension**: it is required for every protected
resource type except CloudFront, so a panel or alarm carrying one matches nothing.

Two of the seven alarms need explaining. **`cdn-4xx`** is the one that catches a broken serving
path: a bundle prefix the bucket does not hold answers 403, and a routing-store read that
`edge-router.js` catches answers 404 — in both cases request volume stays normal and the 5xx rate
never moves, so every other rate alarm here stays flat through a total outage. Its threshold and
the cache-hit one are **provisional**: CloudFront's additional metrics only begin collecting with
this release, and the 4xx baseline is not zero, because every bot probe for an extensioned path is
a 403. Read a day of prod and tune `cdn_alarm_thresholds` in the env YAML.

**`router-errors`** sums execution and validation errors. CloudFront answers a 502 for either, but
a handler returning a malformed response object counts only as a validation error, and that is the
likelier failure after an `edge-router.js` edit. Its dimensions include `DistributionId`, because
function metrics are published per function per distribution; the dashboard reads the same series
with `matchExact` off, but an alarm has no such option and a wrong dimension set is an alarm that
watches nothing and says nothing.

**Moving an alarm between regions means a new resource address.** The AWS provider stores `region`
per resource, so putting `provider = aws.us_east_1` on one that already exists only changes which
credentials are used — the API call still goes to the region in state, and a us-east-1 topic ARN on
a eu-west-1 alarm fails with "Invalid region us-east-1 specified". The ALB's WAF alarm was replaced
by a new `cdn_waf_blocked_requests` rather than re-pointed, which is honest anyway: it watches a
different Web ACL.

`alerts_enabled` in the env YAML turns alerting on, and dev has it off — no CloudWatch alarms and
no subscription. Nobody acts on a dev page. The delivery path itself — both topics, the bridge
Lambda and the webhook secret — costs nothing idle and is built either way, which is what keeps
re-enabling a one-line flip rather than a wait on that secret's seven-day recovery window.

To rehearse end to end: set the `SLACK_WEBHOOK_URL` secret on the `dev` GitHub Environment, flip
`alerts_enabled` to `true`, deploy, and point a host key at a bundle prefix that does not exist —
the 403 alarm is the one a bad activate trips.

Grafana sign-in is Okta SAML, configured from `grafana_okta_saml_metadata_url` and the two
`grafana_*_okta_groups` lists in the env YAML. Blank the URL, or leave the Admin list empty, and the
workspace stays without a SAML configuration — AMG rejects an empty role-value list, so there is no
sign-in-but-nobody-mapped state to land in. Both lists need at least one group. Dashboards provision
either way, since the Terraform provider authenticates with a service-account token rather than
through SAML. A user whose `role` assertion matches neither list is a Viewer.

## Access logs

`cdn/` turns on CloudFront standard logging v2 to its own bucket, partitioned
`{DistributionId}/{yyyy}/{MM}/{dd}` and Hive-compatible, so an Athena query over one day scans one
day. v2 rather than the legacy config: it delivers to a bucket with ACLs disabled, and delivery to
S3 carries no charge beyond the storage. The one part CloudWatch does bill for is Parquet
conversion, so the output format is `w3c`.

Objects expire at `log_retention_days`. Nothing else prunes them, and a prod day is several GB.

## Environment config

Per-environment values live in `environments/<env>/<env>.yaml` and are read with `yamldecode`, so
stacks carry no `workspace == "prod" ? … : …` ternaries. The state bucket for each environment is in
`environments/<env>/backend.config`, and the stacks that read another stack's state read that file
back rather than defaulting to a bucket name — the two environments are in different accounts, so a
prod apply that fell through to dev's bucket would quietly read dev's distribution.

Because the YAML path is derived from `terraform.workspace`, anything outside `dev` / `prod` fails at
parse time — and every stack additionally carries a `workspace_guard` precondition.
`environments/preview/preview.yaml` is the exception: previews are not a workspace, so `cdn/` reads
it from a fixed path while applying into `dev`. All that is left in it is the wildcard suffix.

To validate without a backend, set the workspace through the environment:

```bash
TF_WORKSPACE=dev terraform validate
```

## CDN

`cdn/` serves the static export from S3 with no origin server. One bucket holds every published
bundle under its own `app-<sha12>/` prefix plus one `runtime-config.json` per environment, and
`edge-router.js` — a CloudFront Function on viewer-request — turns a URL into a key under those. It
does what the Node server used to: pick a locale, answer the renamed routes, and rewrite a real id
onto the `__shell__` document its route prerendered.

Which bundle answers is a lookup, not a redeploy. The function reads a CloudFront KeyValueStore
keyed by host, so one distribution serves dev and every preview from different bundles. Terraform
owns the environment's own keys from `bundle_prefix` in the env YAML; the preview workflow writes
its own PR's key.

The public records are weighted A-aliases with a set identifier and no sibling. They were paired
against `edge/`'s records of the same name for the cutover, and the weight stays because Route53
offers no path from a weighted record back to a simple one — dropping `set_identifier` fails the
apply rather than converting it.

`edge-router.spec.ts` runs the deployed function source against `app/[locale]`, so a route added to
the app without a matching entry in the router fails CI rather than 404ing in production.

## WAF blocklist

`cdn/` creates the `<env>-waf-cdn-blocklist` IP set and wires it to a rule at priority 5, but it does
not own the entries: `addresses` seeds an empty set on first create and `lifecycle.ignore_changes`
keeps later applies from reverting whoever edited it last. This repo is public, so committed ranges
tell a scraper exactly what to route around — and a blocklist that needs a release to change is one
that does not get used in the moment it is needed.

Edit it in the console: **WAF & Shield → IP sets**, region Global (CloudFront), then
`block-explorer-<env>-waf-cdn-blocklist`. Add or delete a CIDR and save. Changes take effect within
seconds and need no apply. The console sends the set's `LockToken` back on save, so two concurrent
edits fail loudly rather than one silently clobbering the other.

Whether the rule blocks or merely counts is still Terraform's call, via `waf_blocklist_blocking` in
the env YAML — so the soak convention survives, and `false` is the safe off-switch that keeps the
metrics flowing. `waf_blocked_asns` stays in the YAML too: an ASN names a hosting provider rather
than a target, and the rule is inline in the ACL where `ignore_changes` cannot reach it.

Because the entries are invisible to Terraform, `plan` will never report drift on them. The IP set
itself is the only record of what is blocked, and the Grafana "Blocked by rule" panel is how you
confirm a new entry is biting.

## Applying

`deploy.yml` owns everything long-lived in both accounts. Every merge to `main` gets a `v.X.Y.Z`
tag; the deploy chains off it, applies the stacks in order, publishes the bundle and moves the
routing keys onto it. Nothing here needs applying by hand.

Order matters where a stack reads another's state, and the workflow applies them serially in it:
`dns` → `cdn` → `observability-aws` → `observability-grafana`. Both observability stacks read
`cdn`'s outputs — the distribution, the router function and the Web ACL are what they alarm on and
chart. To run one stack locally against dev:

```bash
cd terraform/cdn
terraform init -backend-config=../environments/dev/backend.config
terraform workspace select -or-create dev
terraform plan
```

`.terraform/` is per-directory, so `init` and the workspace selection are needed in each stack.
`terraform validate` needs a workspace too, but no backend — use `TF_WORKSPACE=dev terraform validate`.

Previews apply no Terraform at all. `deploy-preview.yml` publishes a bundle prefix into dev's bucket
and writes one key into the routing store; `preview-reconcile.yml` sweeps keys whose PR has closed.

State locking is via S3 conditional writes (`use_lockfile = true`), not DynamoDB — no lock table
exists for these stacks, and none is needed.

## Prod

Same stacks, a second account, and a separate state bucket — the same `deploy.yml` applies them on
`release: published`, less `dns`, which exists only in the dev account.

Both public zones stay in the dev account, which is what let the cutover's weighted pair live in one
zone, and is still where `block-explorer.vechain.org` resolves from. So `cdn/` writes records
through a second provider that assumes the role `dns/` owns there, and `bootstrap/` grants the
deploy role nothing on Route53 in its own account.

Standing up the account, in order:

1. Create the state bucket and apply `bootstrap/` by hand — see [bootstrap/README.md](bootstrap/README.md).
2. Set `AWS_OIDC_ROLE_ARN` on the `prod` Environment to that stack's `gha_role_arn`, and
   `PROD_DEPLOY_ROLE_ARN` on `dev` to the same value. Neither is committed: they carry account ids,
   and this repo is public.
3. Merge, so the next dev deploy applies `dns/` and creates the cross-account role. Set its
   `dns_writer_role_arn` output as `DNS_WRITER_ROLE_ARN` on the `prod` Environment.
4. Publish a release. Expect the first apply to surface a missing IAM action or two; that is what the
   scoped role costs.

Prod Grafana has no SAML until an Okta app exists for its workspace: an AMG workspace is its own SAML
audience, so dev's app cannot serve both. Alerts still reach Slack, and dashboards still provision,
since the Terraform provider uses a service-account token.

### The records on the prod domains

`block-explorer.vechain.org` and `explore.vechain.org` each carry a weighted A-alias with set
identifier `cdn-prod`, left over from two cutovers: each shared its name first with an `app-runner`
record and then with `edge/`'s. Each is the only record on its name now, and the weight is a
formality — `cdn/` keeps it because dropping the set identifier would replace the record for no gain.

Worth remembering the next time prod has to move. Two weighted records on one name, ramped with an
UPSERT per step, made rollback a weight change rather than a revert. Four things about the shape.

Terraform cannot turn a simple record into a weighted one. Route53 rejects a weighted record created
beside a simple one of the same name, and the provider offers no path between them, so the apply
fails outright. `block-explorer.vechain.org` got its first weight from a stack that already owned the
record; `explore.vechain.org` needed a manual `change-resource-record-sets` batch deleting the simple
record and creating both weighted ones in one transaction.

Run that batch before the **merge**, not before the release. A merge to `main` cuts a release and the
deploy chains straight off it, so there is no gap in which to do it.

A single apply is not atomic across two records either. The provider sends one Route53 change per
record, so an interrupted apply leaves the weights mismatched. Read both back after every write.

And freeze releases for the length of the ramp. Neither record ignores changes to its weight, so a
release lands the committed number over whatever the ramp has reached.
