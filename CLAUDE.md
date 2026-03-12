# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VeChain Block Explorer - A Next.js-based blockchain explorer for the VeChain network. Supports both mainnet and testnet, with multi-language support (11 locales including English, Spanish, French, German, Italian, Japanese, Portuguese, Russian, Turkish, Chinese, Greek).

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
- **Internationalization**: i18next with react-i18next and next-i18n-router
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
pnpm test                # Run all tests
pnpm test:watch          # Run tests in watch mode

# Code Quality
pnpm lint                # Check code with ESLint
pnpm lint:fix            # Fix linting issues
pnpm format              # Format code with Prettier
pnpm knip                # Check for unused dependencies/exports
pnpm knip:fix            # Auto-fix knip issues

# Full Validation
pnpm validate            # Run build, test, lint, knip and format check
```

## Architecture

### Routing Structure

The app uses Next.js App Router with internationalized routes:

- Routes are nested under `app/[locale]/` for multi-language support
- Main routes: `/`, `/block/[blockId]`, `/transaction/[transactionId]`, `/address/[address]`
- Locale is handled by middleware using next-i18n-router

### Data Flow

1. **API Services** (`services/`)
   - `thor/`: Direct blockchain node interactions via VeChain SDK
     - `client.ts`: Cached ThorClient instances per network
     - `account.ts`, `block.ts`, `transaction.ts`: Core blockchain queries
     - `hooks.ts`: React Query hooks for Thor API
   - `veworld-indexer/`: Indexed data for faster queries (transactions, transfers, NFTs)
     - Separate endpoints for mainnet/testnet
     - `hooks.ts`: React Query hooks for indexer API
   - `b32.ts`: VeChain name service (VNS) lookups

2. **State Management**
   - Zustand store in `lib/stores/settings.ts` manages:
     - Color mode (light/dark)
     - Active network (mainnet/testnet)
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

- Mainnet and Testnet supported
- Each network has URL and contract addresses
- ThorClient instances cached per network in `services/thor/client.ts`

### Environment Variables

Required environment variables (see `.env`):

- `B32_URL`: VeChain name service API
- `NEXT_PUBLIC_COIN_API_URL`: Price data API
- `NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL`: Mainnet indexer
- `NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL`: Testnet indexer
- `NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL`: IPFS gateway for NFT metadata

### Internationalization

- Configured via `i18n/config.ts` with next-i18n-router
- Supported locales: EN, ES, FR, IT, JA, PT, RU, TR, DE, ZH, EL (default: EN)
- Middleware handles locale detection and routing
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

## Important Patterns

1. **No Cross-Route Component Imports**: Never import from another route's `components/` subfolder (e.g., do not import from `app/[locale]/block/components/` inside `app/[locale]/address/`). Each route's `components/` directory is private to that route's directory tree. If a component is needed by multiple routes, move it to a shared location such as `components/` (top-level) or `app/[locale]/components/` (shared across locale routes). Importing from a parent route's `components/` is allowed (e.g., `app/[locale]/block/[blockId]/` can import from `app/[locale]/block/components/`).
2. **Network-aware Data Fetching**: Most API calls require the active network from settings store
3. **Schema Validation**: Use Zod schemas defined in `services/*/schemas.ts` for API responses
4. **Error Boundaries**: Wrap async components with React Error Boundary
5. **Type Predicates**: Use utilities in `lib/type-predicates.ts` for runtime type checking
6. **Chakra UI v3**: This project uses Chakra UI v3 - when working with Chakra components, use the MCP tools to get accurate v3 API information
7. **Figma Integration**: The project uses Figma MCP for design-to-code workflows. Component designs are sourced from the VeChain Block Explorer Figma file and converted to Chakra UI v3 components with custom theme tokens

## Deployment

- Docker support with standalone output mode
- Terraform/Terragrunt configurations in respective directories
- See `DEPLOYMENT.md` for full deployment instructions
