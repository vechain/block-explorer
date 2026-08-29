# Block Explorer Deployment Guide

Dev, prod and per-PR previews all run as ECS Fargate services behind an ALB, in two AWS accounts, from
one image. None of the three is deployed by hand; only the account-setup stacks are.

- **Infrastructure** — [terraform/README.md](terraform/README.md): the stack layout, environment
  config, the shared cache, observability, and how prod's account is stood up.
- **Pipelines** — [.github/workflows/README.md](.github/workflows/README.md): what runs when, and the
  preview lifecycle.

| Environment | Domain                                           | Deployed by                              |
| ----------- | ------------------------------------------------ | ---------------------------------------- |
| Dev         | `dev.block-explorer.vechain.org`                 | every merge to `main`                    |
| Prod        | `block-explorer.vechain.org`                     | publishing the draft release dev left    |
| Preview     | `pr-{number}.block-explorer-preview.vechain.org` | the `create-preview` label on an open PR |

## Versioning

Version numbers come from git tags and are **never stored in `package.json`**, which stays at
`0.0.0-dev`.

Every PR needs one label before it merges — `increment:major`, `increment:minor` or
`increment:patch`; `validate-version-label.yml` blocks the merge without one. On merge,
`codebase-versioning.yml` reads the label and pushes the next `v.X.Y.Z` tag. That tag is what builds
the image and what the UI shows, injected at container start as `APP_VERSION`. Unset, it reads `dev`.

On dev and prod that is the release which last **changed** the app, not necessarily the newest one.
Images are content-addressed (see `scripts/app-content-sha.sh`), so a release carrying only terraform,
workflow or docs changes reuses the existing image, and the deploy carries its version forward rather
than registering a task definition that differs only by a version string — so what the footer shows is
the version actually serving traffic. `.github/workflows/README.md` has the full tagging scheme.

## Releasing to prod

Each dev deploy leaves exactly one draft release. Publishing it is the prod deploy: the image is
promoted from GHCR into the prod account's ECR, the Terraform stacks are applied in order, and the ECS
service is rolled and then checked over its ALB. Dev and prod run the same image, so parity is
structural rather than maintained by hand.

Rolling back is a `workflow_dispatch` of `deploy.yml` against the previous tag, with `prod` as the
environment.

## Public Docker image

The image is published to GitHub Container Registry as a public image, which is what makes it usable
next to a local VeChain node.

```bash
docker pull ghcr.io/vechain/block-explorer:latest
```

`publish-ghcr-image.yml` pushes it on every `v.*` tag, multi-arch. For an ad-hoc push outside CI:

```bash
echo $(gh auth token) | docker login ghcr.io -u $(gh api user --jq .login) --password-stdin
pnpm ghcr:push
```

In a `docker-compose.yml`:

```yaml
services:
  block-explorer:
    image: ghcr.io/vechain/block-explorer:latest
    ports:
      - '3000:3000'
    environment:
      - APP_VERSION=${APP_VERSION}
      - NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL=${NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL}
      - B32_URL=${B32_URL}
      - NEXT_PUBLIC_COIN_API_URL=${NEXT_PUBLIC_COIN_API_URL}
      - NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL}
      - NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL}
```

## When a deploy goes wrong

Start at the workflow run: every deploy plans each stack immediately before applying it, and the roll
step fails loudly if `/api/health` does not come back 200 or `/api/metrics` is reachable from outside.

- **Task starts and dies** — container logs are in CloudWatch under
  `/ecs/block-explorer-<env>-frontend`, and
  the ECS service events name the reason. A missing secret is the usual one; secrets are read only at
  task start, so a value written after a deploy needs another roll.
- **Targets never go healthy** — the target group's health check is `/api/health` on the container
  port. Confirm the task is listening on it before looking at the ALB.
- **Alarms and dashboards** — Grafana, linked from the deploy summary. Alert routing and what is
  alarmed are in [terraform/README.md](terraform/README.md).
- **A preview is stuck** — `preview-reconcile.yml` sweeps orphaned workspaces every six hours and can
  be run on demand.
