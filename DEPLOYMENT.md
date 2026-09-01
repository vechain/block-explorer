# Block Explorer Deployment Guide

Dev, prod and per-PR previews all serve one static bundle from CloudFront and S3, in two AWS accounts,
with no origin server. None of the three is deployed by hand; only the account-setup stacks are.

- **Infrastructure** — [terraform/README.md](terraform/README.md): the stack layout, environment
  config, observability, and how prod's account is stood up.
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
the bundle and what the UI shows, fetched at boot from `runtime-config.json`. Unset, it reads `dev`.

On dev and prod that is the release which last **changed** the app, not necessarily the newest one.
Bundles are content-addressed (see `scripts/app-content-sha.sh`), so a release carrying only terraform,
workflow or docs changes reuses the bundle already in the bucket, and the deploy carries its version
forward rather than rewriting the config with a version that changes nothing — so what the footer
shows is the version actually serving traffic. `.github/workflows/README.md` has the full scheme.

## Releasing to prod

Each dev deploy leaves exactly one draft release. Publishing it is the prod deploy: the Terraform
stacks are applied in order, the bundle is copied into the prod account's bucket, and the hosts are
pointed at it and then checked through CloudFront. Dev and prod serve the same bundle, so parity is
structural rather than maintained by hand.

Rolling back is a `workflow_dispatch` of `deploy.yml` against the previous tag, with `prod` as the
environment. There is no second serving path to fall back to: the ALB, its ECS service and the VPC
they ran in were deleted once both environments had been on CloudFront for a release.

## The public Docker image is gone

`ghcr.io/vechain/block-explorer` was a Next.js server, and a static export has no server to put in a
container. Nothing publishes the image as of this release, and the last tag stays pullable but will
not be updated.

Running the explorer next to a local node now means building it and serving `out/` with any static
file server, plus a `runtime-config.json` of your own. Note that the URL routing the CDN does —
locale selection and the rewrite of `/block/0x…` onto the prerendered shell — is
[terraform/cdn/edge-router.js](terraform/cdn/edge-router.js), and a plain file server does none of it.

## When a deploy goes wrong

Start at the workflow run: every deploy plans each stack immediately before applying it, and the
`activate` step fails loudly if the CDN does not serve the version it just wrote.

- **The site 403s or 404s everywhere** — the routing store names a prefix that is not in the bucket.
  Re-run the deploy; `publish` is what fills it, and `activate` is what points at it.
- **A stale page** — only `runtime-config.json` is ever overwritten in place, and `activate`
  invalidates it. Everything else carries its bundle in the path, so it cannot be stale.
- **A 404 on a route that exists** — the edge router has its own table of routes; `terraform/cdn/edge-router.spec.ts`
  is what keeps it matching `app/[locale]`, and it runs in CI.
- **Alarms and dashboards** — Grafana, linked from the deploy summary. Alert routing and what is
  alarmed are in [terraform/README.md](terraform/README.md).
- **A preview is stuck** — `preview-reconcile.yml` sweeps orphaned routing keys every six hours and
  can be run on demand.
