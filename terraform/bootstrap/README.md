# bootstrap

What the prod account needs before its pipeline can run: the state bucket, the ECR repository the
pipeline promotes release images into, and a GitHub Actions deploy role scoped to this repo.

Applied **by hand, with account admin credentials, in the `prod` workspace only**. The pipeline is
never given `iam` on this role, so it cannot widen its own grants — which also means it cannot apply
this stack.

## One-time

The state bucket is the one resource in this repo created outside Terraform: it holds the state that
would manage it. Versioning matters more here than elsewhere — five state files are written by an
automated pipeline, and a truncated write is otherwise unrecoverable.

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

Then apply the stack and hand the role to GitHub:

```bash
cd terraform/bootstrap
terraform init -backend-config=../environments/prod/backend.config
terraform workspace select -or-create prod
terraform plan
terraform apply

gh variable set AWS_OIDC_ROLE_ARN --env prod --body "$(terraform output -raw gha_role_arn)"
```

The OIDC provider itself is not created here — it already exists in the account, having been added
for the projects that share it, and a second one for the same URL is rejected.

## Grants

Scoped by ARN wherever the service supports resource-level permissions. Three services cannot be:
`ec2` (nothing to pin before the VPC exists), `aps` and `grafana` (workspace ids are generated at
create time). Those are bounded instead by the guardrails policy, which denies any resource tagged
for another project, the other projects' state buckets and registries by name, and identity, account
and audit-trail changes outright.

A missing permission fails an apply rather than doing something unintended, so treat the first prod
apply as the test of this file. Add the action to the narrowest statement that fits and re-apply.
