# Frontend Infrastructure

AWS App Runner deployment for Block Explorer using Terraform workspaces.

## Architecture

- **Service**: AWS App Runner (fully managed container service)
- **State Management**: Terraform workspaces (one per environment)
- **Deployment**: Automated via GitHub Actions
- **Custom Domains**: Configured with automatic DNS validation

## Workspaces

| Workspace             | Purpose                 | Domain                                           | State Location                                                                             |
| --------------------- | ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `production`          | Production environment  | `block-explorer.vechain.org`                     | `s3://vechain-terraform-state-prod/env:/production/frontend/terraform.tfstate`             |
| `preview-pr-{number}` | PR preview environments | `pr-{number}.block-explorer-preview.vechain.org` | `s3://vechain-terraform-state-nonprod/env:/preview-pr-{number}/frontend/terraform.tfstate` |

## Automated Deployment

### Production

- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/deploy-production.yml`
- **Process**:
  1. Build Docker image with tag `prod-{short_sha}`
  2. Push to ECR
  3. Update `prod.yaml` with new image tag
  4. Deploy via Terraform

### Preview Environments

- **Trigger**: PR opened/updated
- **Workflow**: `.github/workflows/deploy-preview.yml`
- **Process**:
  1. Post "Building" comment on PR
  2. Build Docker image with tag `pr-{number}-{short_sha}`
  3. Push to ECR
  4. Generate environment config from template
  5. Deploy via Terraform
  6. Update PR comment with deployment status and URLs
- **Cleanup**: Automatically destroyed when PR is closed (`.github/workflows/destroy-preview.yml`)
- **Concurrency**: Only latest commit per PR deploys (older builds are cancelled)

## Configuration

Environment configuration is stored in YAML files:

### Production

**File**: `terraform/environments/prod/prod.yaml`

```yaml
environment: prod
domain: block-explorer.vechain.org
image_tag: prod-abc1234 # Updated by CI/CD
cpu: 1024 # 1 vCPU
memory: 2048 # 2 GB
min_size: 1 # Always 1 instance (no cold starts)
max_size: 10
```

### Preview

**Template**: `terraform/environments/preview/preview.yaml.example`
**Generated**: `terraform/environments/preview-pr-{number}/preview-pr-{number}.yaml`

```yaml
environment: preview-pr-123
domain: pr-123.block-explorer-preview.vechain.org
image_tag: pr-123-abc1234 # Set by CI/CD
cpu: 512 # 0.5 vCPU (smaller for previews)
memory: 1024 # 1 GB
min_size: 1 # App Runner requires ≥1
max_size: 2
```

## Resources Created

Per environment:

- **App Runner Service** - Runs the Next.js application
- **Auto-scaling Configuration** - Defines scaling limits
- **Custom Domain Association** - Links custom domain to service
- **Route53 Records** - DNS records (A record + validation CNAMEs)

Production only:

- **Secrets Manager Secret** - `block-explorer/prod/indexer-rate-limit-bypass`

## Secrets

### Indexer rate limit bypass

`/api/indexer` caches indexer responses server-side, so every user's request leaves from
the same App Runner IP and the indexer's per-IP rate limit applies to the whole app.
Sending `x-rate-limit-bypass` lifts it.

Terraform creates the secret (prod only) and seeds it with a blank placeholder. The app
trims the value and treats blank as unset, so it sends no header until someone sets a
real token - a bogus token the indexer would reject is never sent.

#### Releasing it the first time

The four steps must happen in this order. Step 1 is easy to forget and fails the
production deploy if skipped.

All commands below target the AWS account that hosts block-explorer. Terraform has no
`--profile` flag, so it is selected with `AWS_PROFILE`; the CLI commands pass `--profile`
explicitly so they stay copy-pasteable on their own. Substitute your own profile name if
it differs from the example.

**0. Select the profile and confirm which account you are pointed at.**

```bash
export AWS_PROFILE=explorer-dev-admin
aws sts get-caller-identity --profile explorer-dev-admin
```

Note the account ID. Steps 1 and 3 modify **production** infrastructure, so confirm this
is the account that owns the `block-explorer-terraform-state-prod` state bucket and the
`prod-block-explorer` App Runner service before continuing. If your credentials expire
mid-run, re-authenticate and re-export - terraform will otherwise fail at `init`.

**1. Grant the instance role read access - before the release.**

App Runner resolves `runtime_environment_secrets` using the instance role, which lives in
`terraform/account-level`. No workflow applies that directory; it is manual.

```bash
cd terraform/account-level
terraform init
terraform workspace select prod   # NOT default - see below
terraform plan
```

The plan must read `Plan: 1 to add, 0 to change, 0 to destroy` - the inline policy and
nothing else. **If it proposes creating the ECR repository, IAM roles or Route53 zones,
you are in the wrong workspace or the wrong account. Stop.** Those already exist, and
applying would either fail on name conflicts or build a parallel set that App Runner does
not use.

```bash
terraform apply
```

Skipping this step does not fail the plan. It fails partway through the production
apply: the secret gets created, then the App Runner service update fails because the
instance role cannot call `GetSecretValue`. Recover by applying this step and re-running
the failed workflow.

**2. Release as usual.** Label the PR (`increment:patch` / `minor` / `major`), merge to
`main`, and let the release trigger `deploy-production.yml`. That apply creates the
secret with its blank placeholder and wires it into App Runner. Nothing changes
behaviourally yet - the app still sends no bypass header. This step runs in CI under its
own OIDC role, so your local profile is not involved.

**3. Set the real token.**

```bash
aws secretsmanager put-secret-value \
  --secret-id block-explorer/prod/indexer-rate-limit-bypass \
  --secret-string '<token>' \
  --region eu-west-1 \
  --profile explorer-dev-admin
```

Terraform ignores changes to the value, so later applies will not revert it.

**4. Redeploy so App Runner picks it up.** Secrets are injected when an instance starts,
so step 3 alone changes nothing. Either wait for the next release, or trigger one now:

```bash
aws apprunner start-deployment --region eu-west-1 --profile explorer-dev-admin \
  --service-arn "$(
    aws apprunner list-services --region eu-west-1 --profile explorer-dev-admin \
      --query "ServiceSummaryList[?ServiceName=='prod-block-explorer'].ServiceArn" \
      --output text
  )"
```

A deployment that reaches `RUNNING` confirms the IAM grant from step 1 worked - App
Runner cannot start an instance whose secrets it fails to resolve. Watch it with:

```bash
aws apprunner list-operations --region eu-west-1 --profile explorer-dev-admin \
  --service-arn "<arn from above>" --max-results 1
```

#### Rotating or disabling later

Rotating is steps 3 and 4 only. To turn the bypass off without a code change, set the
value back to a single space and redeploy: the app reads blank as unset and stops
sending the header.

## Manual Deployment

### Prerequisites

- Account-level infrastructure deployed
- Docker image pushed to ECR
- Environment config file created

### Deploy Production

```bash
cd terraform/frontend
terraform init -backend-config=../environments/production/backend.config
terraform workspace select production
terraform plan
terraform apply
```

### Deploy Preview

```bash
cd terraform/frontend
terraform init -backend-config=../environments/preview/backend.config

# Create workspace and config
terraform workspace new preview-pr-123
cp ../environments/preview/preview.yaml.example ../environments/preview-pr-123/preview-pr-123.yaml
# Edit the config file with PR number and image tag

terraform plan
terraform apply
```

### Destroy Preview

```bash
terraform workspace select preview-pr-123
terraform destroy
terraform workspace select default
terraform workspace delete preview-pr-123
rm -rf ../environments/preview-pr-123
```

## Custom Domain Setup

Custom domains are automatically configured:

1. **App Runner** creates custom domain association
2. **Terraform** queries validation records from App Runner
3. **Route53** records are created for DNS validation
4. **App Runner** verifies ownership (5-10 minutes)
5. **Domain** becomes active with HTTPS

## Outputs

After deployment:

| Output                 | Description              | Example                                          |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| `service_url`          | Default App Runner URL   | `https://xyz.awsapprunner.com`                   |
| `custom_domain_url`    | Custom domain URL        | `https://block-explorer.vechain.org`             |
| `service_arn`          | App Runner service ARN   | For API operations                               |
| `custom_domain_status` | Domain validation status | `active` or `pending_certificate_dns_validation` |

## Cost Optimization

- **Preview Environments**: Minimum 1 instance (App Runner requirement), scales to 2 max
- **Auto-cleanup**: Preview environments destroyed when PR closes
- **Image Lifecycle**: Old preview images automatically deleted (keeps last 10)

## Troubleshooting

### Custom domain not activating

- Check validation records in Route53
- Wait 5-10 minutes after first deployment
- Verify ACM certificate status
- Use default App Runner URL in the meantime

### Terraform state locked

- Check for concurrent deployments (same PR)
- Concurrency control prevents multiple applies per PR
- If stuck, manually release lock via DynamoDB

### Health check failures

- App Runner health check: `GET /` on port 3000
- Ensure Next.js binds to `0.0.0.0` (set via `HOSTNAME` env var)
- Check App Runner logs in CloudWatch
