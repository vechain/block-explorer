# Terraform

One stack per directory, wired together only through `terraform_remote_state`. Each stack owns its
own S3 state key; `terraform.workspace` selects the environment (`dev` / `prod`).

## Layout

| Stack                      | Owns                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| `network/`                 | VPC, three subnet tiers, NAT, S3 gateway endpoint                    |
| `ecs/`                     | ECS cluster (Container Insights on)                                  |
| `acm/`                     | Public certificate for the environment's domain, DNS-validated       |
| `edge/`                    | ALB, listeners, target group, security groups, WAF, DNS record       |
| `observability-aws/`       | AMP, Grafana, SNS, the Slack bridge, AMP rules and CloudWatch alarms |
| `observability-collector/` | YACE + ADOT service bridging CloudWatch metrics into AMP             |
| `frontend/`                | The explorer's ECS service, task definition and secret               |
| `observability-grafana/`   | Grafana datasources and dashboards                                   |
| `account-level/`           | Legacy: ECR, Route53 zones, App Runner IAM and autoscaling           |
| `app-runner/`              | Legacy: the App Runner service still serving prod                    |

`modules/ecs-webservice` is the shared Fargate service shape — dev, prod and phase 3's previews
differ by parameters, not structure. `modules/observability-sidecar` renders the ADOT container that
scrapes `/api/metrics` over the task's loopback.

The two legacy stacks are removed once prod has moved to ECS. `app-runner/` was named `frontend/`
until the ECS work started; its state key is declared in `provider.tf` and is still
`frontend/terraform.tfstate`, so the rename moved no state.

## Observability

Two collectors, and the split is the part that is easy to get wrong. The sidecar rides in each app
task and reads that task: cgroup CPU, memory, network and disk, plus a loopback scrape of the app's
own `/api/metrics`. `observability-collector/` is one standalone task reading the AWS control plane
through YACE, which exists because the ADOT distribution ships no CloudWatch receiver. Neither can do
the other's job, and both remote-write into the same AMP workspace.

Dashboards live in `observability-grafana/` as a separate stack because the Grafana provider cannot
initialise against a workspace the same apply is creating. AWS resource metrics are read straight
from CloudWatch rather than through AMP, so the ALB, ECS and WAF panels keep working when the
collector is the thing that has broken. The alert rules deep-link to panel IDs in
`dashboards/overview.json` — renumbering a panel breaks the link from Slack.

Alerts evaluate in every environment but `alerts_enabled` in the env YAML controls whether they are
delivered, and dev has it off. To rehearse the path end to end: set the `SLACK_WEBHOOK_URL` secret on
the `dev` GitHub Environment, flip `alerts_enabled` to `true`, scale the service to zero, and confirm
the no-healthy-targets alarm arrives and then recovers. Nobody can sign in to Grafana until
`GRAFANA_OKTA_SAML_METADATA_URL` is set — the dashboards provision regardless, since the Terraform
provider authenticates with a service-account token rather than through SAML.

## Environment config

Per-environment values live in `environments/<env>/<env>.yaml` and are read with `yamldecode`, so
stacks carry no `workspace == "prod" ? … : …` ternaries. The state bucket for each environment is in
`environments/<env>/backend.config`.

Because the YAML path is derived from `terraform.workspace`, anything outside `dev` / `prod` fails at
parse time — and every stack additionally carries a `workspace_guard` precondition. To validate
without a backend, set the workspace through the environment:

```bash
TF_WORKSPACE=dev terraform validate
```

## Applying

`deploy-dev.yml` owns dev. Every merge to `main` gets a `v.X.Y.Z` tag, which builds the release
image; the deploy chains off that build, pins `image_tag`, applies the stacks in order and rolls the
ECS service. Nothing about dev needs applying by hand.

Order matters where a stack reads another's state, and the workflow applies them serially in it:
`network` → `ecs` → `acm` → `edge` → `observability-aws` → `observability-collector` → `frontend` →
`observability-grafana`. `frontend` sits after the AMP workspace because its sidecar remote-writes to
it; `observability-aws`'s alarms name the ECS service by convention rather than reading it back,
which is what keeps that from being a cycle. To run one stack locally against dev:

```bash
cd terraform/network
terraform init -backend-config=../environments/dev/backend.config
terraform workspace select -or-create dev
terraform plan
```

`.terraform/` is per-directory, so `init` and the workspace selection are needed in each stack.
`terraform validate` needs a workspace too, but no backend — use `TF_WORKSPACE=dev terraform validate`.

State locking is via S3 conditional writes (`use_lockfile = true`), not DynamoDB — no lock table
exists for these stacks, and none is needed.

Two things the pipeline deliberately does not do:

- **Setting the indexer bypass token.** It is seeded blank, because the app treats blank as unset and
  sends no header — so a wrong token is never sent. Put the real value into the secret named in the
  `indexer_rate_limit_bypass_secret_arn` output, then re-run the deploy, since secrets are injected
  only when a task starts. Skipping this does not break health checks; it means every server-side
  indexer call leaves from the one NAT IP and takes the indexer's per-IP rate limit for the whole
  environment.
- **Deploying prod.** Prod is still App Runner, on `deploy-production.yml`, until the prod account
  exists.
