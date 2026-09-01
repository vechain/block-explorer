# Block Explorer

This is the frontend for the VeChain Block Explorer.

## Stack

- React 19
- TypeScript
- Next.js 15
- Chakra UI
- TanStack Query

## Development

Ensure you are using a compatible version of Node.js. It is recommended to use nvm to manage your Node.js versions.

```bash
nvm use
```

Install the dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

## Testing

Run unit tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Linting & Formatting

```bash
pnpm lint      # Check for issues
pnpm lint:fix  # Fix issues automatically
pnpm format    # Format code
```

## Versioning

This project uses **automated semantic versioning**. Version numbers are managed through git tags, not `package.json`.

### How to Version Your Changes

1. Open a PR to `main`
2. Add one of these labels:
   - `increment:patch` - Bug fixes (1.0.0 → 1.0.1)
   - `increment:minor` - New features (1.0.0 → 1.1.0)
   - `increment:major` - Breaking changes (1.0.0 → 2.0.0)
3. When merged, a new version tag is automatically created

### Note on `package.json` Version

The `package.json` version is set to `0.0.0-dev` and is **not used** for production versioning. The real version comes from git tags, served to the browser in `runtime-config.json`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment documentation.

### Quick Reference

- **Production**: Deploy via GitHub Actions from a version tag
- **Preview**: Automatic on PR creation at `pr-{number}.block-explorer-preview.vechain.org`
- **Cleanup**: Preview environments are automatically destroyed when PRs are closed
