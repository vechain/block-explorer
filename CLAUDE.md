# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VeChain Block Explorer - A Next.js-based blockchain explorer for the VeChain network. Supports mainnet, testnet, and (opt-in via dev mode) a locally configurable solo network, with multi-language support (11 locales including English, Spanish, French, German, Italian, Japanese, Portuguese, Russian, Turkish, Chinese, Greek).

## Technology Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Chakra UI v3 with Emotion
- **State Management**: Zustand (with persist middleware)
- **Data Fetching**: TanStack Query (React Query)
- **Blockchain SDK**: VeChain SDK (@vechain/sdk-core, @vechain/sdk-network)
- **Testing**: Vitest with React Testing Library
- **Linting**: ESLint with TypeScript, React, and i18next plugins
- **Formatting**: Prettier
- **Internationalization**: i18next with react-i18next; locale routing is done by the CDN
- **Package Manager**: pnpm (v9.15.4)
- **Node.js**: v20.19.0 (see `.nvmrc`)

## Development Commands

```bash
# Development
pnpm dev                  # Start dev server
nvm use                   # Use correct Node version

# Building
pnpm build               # Production build with Turbopack

# Testing
pnpm test                # Run all tests (vitest run)
pnpm test:watch          # Run tests in watch mode
pnpm test path/to/file.spec.ts          # Run single test file
pnpm test -t 'test name pattern'        # Run tests matching name

# Code Quality
pnpm lint                # Check code with ESLint
pnpm lint:fix            # Fix linting issues
pnpm format              # Format code with Prettier
pnpm ts-check            # TypeScript type-check (no emit)
pnpm knip                # Check for unused dependencies/exports
pnpm knip:fix            # Auto-fix knip issues

# Full Validation
pnpm validate            # Run build, test, lint, knip and format check
```

Pre-commit hook (husky + lint-staged) runs `ts-check:staged` on staged `.ts`/`.tsx` files.

## Architecture

### Routing Structure

The app uses Next.js App Router with internationalized routes:

- Routes are nested under `app/[locale]/` for multi-language support
- Main routes: `/`, `/block/[blockId]`, `/transaction/[transactionId]`, `/address/[address]`
- The app builds as a static export (`output: 'export'`), so there are no route handlers and no
  middleware. Locale selection, the legacy 308s and the rewrite of a dynamic route onto its
  prerendered `__shell__` document are all done by
  [terraform/cdn/edge-router.js](terraform/cdn/edge-router.js) at the CDN edge
- A dynamic route's `page.tsx` is a server shell exporting `generateStaticParams`; its body is a
  client `<X>Route` component that reads the id back off the URL via `useRouteSegments`

### Data Flow

1. **API Services** (`services/`)
   - `thor/`: Direct blockchain node interactions via VeChain SDK
     - `client.ts`: Cached ThorClient instances per network
     - `account.ts`, `block.ts`, `transaction.ts`: Core blockchain queries
     - `hooks.ts`: React Query hooks for Thor API
   - `veworld-indexer/`: Indexed data for faster queries (transactions, transfers, NFTs)
     - Separate endpoints for mainnet, testnet, and solo (solo URL configurable at runtime)
     - `hooks.ts`: React Query hooks for indexer API
     - Cursor-based pagination via `useInfiniteQuery` (`useLatestTransactions`, `useLatestTransfers`)
   - `b32.ts`: VeChain name service (VNS) lookups

2. **State Management**
   - Zustand store in `lib/stores/settings.ts` manages:
     - Color mode (light/dark)
     - Active network (mainnet/testnet/solo)
     - Dev mode toggle, solo node URL, and solo indexer URL (only honored when `allowDevMode` is true)
     - Currency preference (USD/EUR/GBP/CNY/JPY/AUD/CAD)
   - Persisted to localStorage

3. **Query Client**
   - TanStack Query configured in `lib/query-client/`
   - React Query DevTools enabled in development
   - Wrapped around entire app in root layout

### Component Organization

- `components/ui/`: Core reusable UI components (Table, Links, CopyToClipboard)
- `components/ui-legacy/`: Legacy components (being migrated)
- `components/theme/`: Chakra UI theme configuration
- `components/navigation/`: Navigation components
  - `Header.tsx`: Main header with logo and navigation menu (client component)
  - `NetworkSelect.tsx`: Mainnet/Testnet toggle component
  - `SearchBar.tsx`: Search component for blocks, transactions, addresses
- `components/error/`: Error boundary components
- Page-specific components live in `app/[locale]/[route]/components/`

### Theming

Chakra UI v3 custom theme configured in `components/theme/config.tsx`:

- Custom color tokens for blockchain explorer aesthetic (text-primary, bg-primary, border-primary, etc.)
- Dark mode design with glass-morphism surfaces
- Custom font: Rubik (loaded via next/font/google)
- Responsive design tokens and breakpoints

### Network Configuration

Networks defined in `lib/constants/network.ts`:

- Mainnet, Testnet, and Solo supported (`NetworkName` enum)
- Each network has URL and contract addresses
- Solo node URL + solo indexer URL are user-configurable at runtime via the settings store; defaults come from `lib/constants/dev-mode.ts`
- ThorClient instances cached per network in `services/thor/client.ts`
- Cross-network fallback: when a tx, block, or search query misses on the active network, the explorer transparently retries against the other public networks so a deep link still resolves

### Environment Variables

Env access is split into two layers — never read `process.env` directly outside these modules:

- `env.public.ts`: build-time `NEXT_PUBLIC_*` vars baked into the client bundle. `.env.production` holds their committed values, so they are part of the bundle's content SHA.
- `lib/runtime-config/`: per-environment vars. `<RuntimeConfigProvider>` fetches `/runtime-config.json` at boot, publishes it to `window.__BLOCK_EXPLORER_RUNTIME_CONFIG__` and renders nothing until it lands, so `getRuntimeConfig()` stays synchronous for the stores and services that call it. The CDN answers that path from `s3://<bucket>/<env>/runtime-config.json`, which the deploy's `activate` step writes — so one content-addressed bundle serves dev, prod and every preview.

Required (see `.env`):

- `NEXT_PUBLIC_COIN_API_URL`: Price data API
- `NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL`: Mainnet indexer
- `NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL`: Testnet indexer
- `NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL`: Default solo indexer URL when dev mode is on
- `NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL`: IPFS gateway for NFT metadata

Per environment (fields of `<env>/runtime-config.json`, written by the deploy):

- `appVersion`: version string the footer shows; `dev` when unset. Fetched rather than baked so one bundle serves every PR and every release — see the versioning section.
- `allowDevMode`: exposes the dev-mode toggle (and the solo network) in the UI. `public/runtime-config.json` turns it on for `pnpm dev`, which is the only thing that file serves.
- `b32Url`, `openchainUrl`, `sourcifyUrl`: upstreams the browser calls itself. All default to the public host.
- `soloContracts`: solo-network contract overrides

Set them per environment through `runtime_config` in `terraform/environments/<env>/<env>.yaml`.

### Internationalization

- Configured via `i18n/config.ts`
- Supported locales: EN, ES, FR, IT, JA, PT, RU, TR, DE, ZH, EL (default: EN)
- The CDN detects the locale (the `NEXT_LOCALE` cookie, then `Accept-Language`) and redirects; the
  default locale serves unprefixed, so `/en/tokens` 307s to `/tokens`
- Translations loaded dynamically from `i18n/languages/*.json` (see `i18n/index.ts` and `i18n/provider.tsx`)

## Code Style

Prettier configuration (`.prettierrc`):

- 2 space indentation
- 120 character line width
- Single quotes for JS/TS (double quotes in JSX)
- No semicolons
- Trailing commas everywhere
- LF line endings

ESLint configuration (`.eslintrc.json`):

- Extends Next.js, TypeScript, and React recommended rules
- Enforces i18n for user-facing text (`i18next/no-literal-string`)
- No unused variables (underscore prefix allowed)
- No explicit `any` types
- Console statements restricted (warn/error only)

## Commits & PRs

**Prose bloat is a merge blocker.** [.github/workflows/pr-bloat.yml](.github/workflows/pr-bloat.yml) fails a PR on a description over 240 words (or under 10), a tool-attribution trailer, or a comment block that outweighs the code it documents (>1:1 against attached added-code lines; 10 lines absolute; a top-of-file header measures against the whole file). Density and long `docs/` paragraphs are advisory; `docs/**` never blocks. `pnpm check:pr-bloat` runs it locally. Bypass is the `verbose-ok` label, which anyone including the author may apply. Thresholds are env-overridable in [scripts/check-pr-bloat.mjs](scripts/check-pr-bloat.mjs).

**Write reviewer-facing prose at final length — don't draft long and trim.** The budget is the target, not a limit to approach.

- **PR descriptions:** what changed and why, in two or three sentences. Skip `## Summary` / `## Test plan` scaffolding unless there is genuinely something new to test. No tool-attribution trailers — that includes the "Generated with Claude Code" footer.
- **Comments:** a comment must not outweigh the code it documents — on a one-line field addition, that means no comment.
- Don't restate what the code does, what a technical term already implies, or what a linked design doc already says.
- Don't explain what something does _not_ do. State what is; the reader can see the absence.
- **But keep visual/semantic bridges.** Mapping something observable to what it means ("dashed orange line = the alert threshold") is real information, not padding.

## Important Patterns

1. **No Cross-Route Component Imports**: Never import from another route's `components/` subfolder (e.g., do not import from `app/[locale]/block/components/` inside `app/[locale]/address/`). Each route's `components/` directory is private to that route's directory tree. If a component is needed by multiple routes, move it to a shared location such as `components/` (top-level) or `app/[locale]/components/` (shared across locale routes). Importing from a parent route's `components/` is allowed (e.g., `app/[locale]/block/[blockId]/` can import from `app/[locale]/block/components/`).
2. **Network-aware Data Fetching**: Most API calls require the active network from settings store
3. **Schema Validation**: Use Zod schemas defined in `services/*/schemas.ts` for API responses
4. **Error Boundaries**: Wrap async components with React Error Boundary
5. **Type Predicates**: Use utilities in `lib/type-predicates.ts` for runtime type checking
6. **Chakra UI v3**: This project uses Chakra UI v3 - when working with Chakra components, use the MCP tools to get accurate v3 API information
7. **Figma Integration**: The project uses Figma MCP for design-to-code workflows. Component designs are sourced from the VeChain Block Explorer Figma file and converted to Chakra UI v3 components with custom theme tokens
8. **Recent Activity Data Sources**: Blocks, transactions and transfers all come from indexer endpoints (`useLatestBlocks` → `/api/v1/blocks`, `useLatestTransactions` → `/api/v1/transactions/latest`, `useLatestTransfers` → `/api/v1/transfers/latest`), each cursor-paginated via `useInfiniteQuery`. Transfers filterable by `eventType[]` (`VET` / `FUNGIBLE_TOKEN` / `NFT` / `SEMI_FUNGIBLE_TOKEN`). `/api/v1/blocks` serves collapsed headers without `isTrunk`/`isFinalized`, so per-transaction detail (clauses, VTHO paid) and lookup by block id still go to Thor — `useBlockDetails` fans out `blockExpandedQueryOptions` over one rendered page, cached per `[network, blockNumber]` with `staleTime: Infinity`. See `.cursor/rules/progressive-block-fetching.mdc`.
9. **Formatting at the UI boundary**: Keep raw values (`number`, `bigint`, `HexString`, timestamps) in services/schemas. Format only when rendering, locale-aware. All formatting helpers live in `lib/utils/units.ts` (pure) and `hooks/useFormatting.ts` (React) — never define inline abbreviation/locale logic in components. Available: `formatNumber`/`useFormatNumber`, `formatCurrency`/`useFormatCurrency`, `formatCompactCurrency`/`useFormatCompactCurrency`, `formatAbbreviated`, `formatAmount`/`useFormatAmount`, `formatPercentage`. Dates via `formatDateFromTimestamp` / `useFormatDate` (defaults to UTC); relative time via `components/ui/AgeText.tsx`. Locale comes from `useLocale()` hook in client code, or passed explicitly in pure utils. See `.cursor/rules/formatting-l10n.mdc` and `.cursor/rules/number-formatting.mdc`.
10. **TanStack Query v5**: queries return `{ data, isPending, isError }` — not `isLoading`. Use `queryOptions()` helper for type-safe query definitions.

## Versioning

Automated semantic versioning via git tags — `package.json` version is `0.0.0-dev` and unused. To version a PR, add one label before merging to `main`:

- `increment:patch` — bug fixes (1.0.0 → 1.0.1)
- `increment:minor` — new features (1.0.0 → 1.1.0)
- `increment:major` — breaking changes (1.0.0 → 2.0.0)

Real version comes from the git tag, served in `runtime-config.json` rather than baked into the
bundle — so the bundle carries no PR or release identity and one build serves them all.

Bundles are content-addressed: `scripts/app-content-sha.sh` (also `pnpm app:sha`) hashes every file
the build reads, and that `app-<sha12>` is both the artifact's name and its prefix in the bucket. A
release changing only terraform, workflows or docs therefore skips both the build and the upload —
the deploy pins the version to whatever that bundle already serves, so a new release cannot rewrite
the config with a version that changes nothing.

## Deployment

- Static export served from CloudFront and S3, with no origin server
- Dev and previews share one distribution in the dev account; prod has its own. `hosting` in the env YAML is what points a name at CloudFront rather than at the ALB, and prod is still `ecs`
- Terraform is one stack per directory under `terraform/`, wired only through `terraform_remote_state`
- Merging to `main` deploys dev and leaves one draft release; publishing it deploys prod
- Preview envs deploy on the `create-preview` label at `pr-{number}.block-explorer-preview.vechain.org`, destroyed on PR close
- See `DEPLOYMENT.md`, `terraform/README.md` and `.github/workflows/README.md`
