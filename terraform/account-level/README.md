# Account-Level Infrastructure

What is left of the App Runner setup in `explorer-dev` after the move to ECS. Applied by hand, and
rarely.

## Resources

### Route53 Hosted Zones

Both public zones live here, in the dev account, which is what lets a record for prod and a record for
dev sit in one zone — and is what made the weighted cutover possible. `cdn/` writes into them from
the prod account through the role `dns/` owns.

- **Production**: `block-explorer.vechain.org`
- **Preview**: `block-explorer-preview.vechain.org`

### ACM Certificates

Only the wildcard is left, and nothing reads it: `cdn/` issues its own certificate in us-east-1,
covering every alias the distribution answers on, previews included. The prod certificate went with
App Runner.

Both certificates validate against the same Route53 record, because ACM reuses one CNAME per domain
per account. `cdn/` owns it too, with `allow_overwrite`, so dropping the wildcard or destroying this
stack deletes the record dev's CloudFront certificate renews against. Re-apply `cdn/` in dev after
either.

- **Preview**: `*.block-explorer-preview.vechain.org` (wildcard, DNS validated)

## Deployment

```bash
cd terraform/account-level
terraform init
terraform workspace select prod
terraform plan
terraform apply
```

State is in the dev account, at
`s3://block-explorer-terraform-state-prod/env:/prod/account-level/terraform.tfstate`, under the
`prod` workspace despite the account. Select it before planning: `default` is empty, and a plan there
creates both zones again.

## Outputs

Nothing reads these through `terraform_remote_state` any more — `app-runner/` was the only consumer,
and the stacks that need a zone or a certificate look it up by name instead.

| Output                                  | Description                           |
| --------------------------------------- | ------------------------------------- |
| `block_explorer_public_zone_prod_id`    | Route53 zone ID for production        |
| `block_explorer_public_zone_preview_id` | Route53 zone ID for previews          |
| `preview_certificate_arn`               | Wildcard SSL certificate for previews |
