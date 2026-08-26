# Terraform

One stack per directory, wired together only through `terraform_remote_state`. Each stack owns its
own S3 state key; `terraform.workspace` selects the environment (`dev` / `prod`).

## Layout

| Stack            | Owns                                                           |
| ---------------- | -------------------------------------------------------------- |
| `network/`       | VPC, three subnet tiers, NAT, S3 gateway endpoint              |
| `ecs/`           | ECS cluster (Container Insights on)                            |
| `acm/`           | Public certificate for the environment's domain, DNS-validated |
| `edge/`          | ALB, listeners, target group, security groups, WAF, DNS record |
| `account-level/` | Legacy: ECR, Route53 zones, App Runner IAM and autoscaling     |
| `app-runner/`    | Legacy: the App Runner service still serving prod              |

The two legacy stacks are removed once prod has moved to ECS. `app-runner/` was named `frontend/`
until the ECS work started; its state key is declared in `provider.tf` and is still
`frontend/terraform.tfstate`, so the rename moved no state.

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

Nothing here is wired to a workflow yet, so apply by hand. Order matters where a stack reads
another's state: `network` → `ecs` → `acm` → `edge`.

```bash
cd terraform/network
terraform init -backend-config=../environments/dev/backend.config
terraform workspace select -or-create dev
terraform plan
terraform apply
```

`.terraform/` is per-directory, so `init` and the workspace selection are needed in each stack.

State locking is via S3 conditional writes (`use_lockfile = true`), not DynamoDB — no lock table
exists for these stacks, and none is needed.
