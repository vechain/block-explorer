# bootstrap

What an account needs before its pipeline can run: the state bucket, the registry the pipeline
promotes images into, and a GitHub Actions deploy role scoped to this repo.

Applied **by hand, with account admin credentials**, one workspace per account — `prod` and `dev`.
The pipeline is never given `iam` on this role, so it cannot widen its own grants — which also means
it cannot apply this stack.

## Why dev has a role here at all

dev's pipeline used `explorer-github-actions-dev`, which is shared: it trusts `repo:vechain/<name>:*`
for five repos, so a workflow on any branch of any of them can assume it, and it carries
`AdministratorAccess` in an account three other projects have resources in. Under it the pipeline
could grant itself anything, including admin on a role it also passes to a task.

That role is **left exactly as it is** — `vechain/explorer`, `mass`, `chain-scanner` and
`insight-app` still assume it, and narrowing it would break them. This stack adds a second,
dedicated role instead, which is what prod already did: `block-explorer-github-actions-prod` and the
legacy `explorer-github-actions-prod` coexist in that account.

## Per-account differences

`local.accounts` in [locals.tf](locals.tf) is keyed by workspace, rather than taking values from a
`-var`, so a hand-applied stack cannot be given the wrong account's shape by a forgotten flag.

|                     | prod                    | dev                                                                             |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| OIDC subjects       | `environment:prod`      | `environment:dev`, `environment:preview`, `pull_request`, `ref:refs/heads/main` |
| Registry            | created here            | `account-level/`'s, looked up                                                   |
| Route53             | through `dns/`'s role   | writes both public zones directly                                               |
| Roles it may manage | `block-explorer-prod-*` | `block-explorer-dev-*`, `-prod-dns-writer`                                      |

dev needs four subjects because it runs more than a deploy: previews apply under their own
environment, tear down on a bare `pull_request`, and are swept from `main`. `pull_request` is the
widest of the four — declaring an environment in `destroy-preview.yml` would remove it.

dev's two role patterns are not one glob because `dns/` breaks the `<project>-<workspace>-` shape:
it is applied in the dev workspace but names its role for the account that assumes it. Neither
matches `block-explorer-github-actions-dev`, which is what keeps the pipeline out of its own grants.

The Route53 grant is pinned to our two zone ARNs because this account also holds the legacy
explorer's `explore.vechain.org`, and `ChangeResourceRecordSets` takes no tag condition that could
bound a wildcard.

## One-time, per account

The state bucket is the one resource in this repo created outside Terraform: it holds the state that
would manage it. Versioning matters more here than elsewhere — every state file in it is written by
an automated pipeline, and a truncated write is otherwise unrecoverable. dev's already exists.

```bash
export AWS_PROFILE=explorer-prod-admin AWS_REGION=eu-west-1
BUCKET=vechain-block-explorer-terraform-state-prod

aws s3api create-bucket --bucket "$BUCKET" \
  --create-bucket-configuration LocationConstraint=eu-west-1
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
```

Then apply the stack and hand the role to GitHub. `ENV` is `prod` or `dev`; the workspace is what
selects the account's configuration, so it must match the backend config.

```bash
ENV=dev
cd terraform/bootstrap
terraform init -reconfigure -backend-config=../environments/$ENV/backend.config
terraform workspace select -or-create $ENV
terraform plan
terraform apply

gh variable set AWS_OIDC_ROLE_ARN --env $ENV --body "$(terraform output -raw gha_role_arn)"
```

In dev the preview workflows read `secrets.AWS_ACC_ROLE` rather than the Environment variable, so
that secret has to be repointed at the same ARN for previews to move with the deploy. Until both are
switched, dev keeps using the shared role and nothing changes.

The OIDC provider itself is not created here — it already exists in both accounts, having been added
for the projects that share them, and a second one for the same URL is rejected.

## Grants

Scoped by ARN wherever the service supports resource-level permissions. `cloudfront`, `wafv2`,
`acm`, `aps` and `grafana` cannot be — distribution, ACL and workspace ids are all generated at
create time. Those are bounded instead by the guardrails policy, which denies any resource tagged
for another project, the other projects' state buckets and registries by name, and identity, account
and audit-trail changes outright.

Alarms and SNS topics are wildcarded on **region**, not scoped to `eu-west-1`: CloudFront and its
Web ACL publish metrics only to us-east-1, and a CloudWatch alarm may act only on a topic in its own
region. The name prefix is what bounds them.

A missing permission fails an apply rather than doing something unintended, so treat the first apply
in a workspace as the test of this file. Add the action to the narrowest statement that fits and
re-apply. Watch for resources carrying `tags`: `default_tags` makes the provider call the service's
`TagResource` and `ListTagsForResource` against the resource'"'"'s own ARN, which a statement scoped to
a different ARN shape will miss.

Both policies are capped at 6144 characters by AWS, which a `precondition` checks before an apply
gets that far. dev's allow policy is the larger of the two at roughly 4.6k.
