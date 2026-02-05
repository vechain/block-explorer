#!/usr/bin/env node

/**
 * Checks if the local token registry is up to date with the official vechain/token-registry.
 *
 * Usage: pnpm token-registry:check
 *
 * This script is run as part of the pre-commit hook.
 * It exits with code 1 if updates are available, blocking the commit.
 */

import { NETWORKS, fetchRegistry, getLocalRegistry, compareRegistries } from './token-registry-utils.mjs'

async function main() {
  let hasUpdates = false
  const updates = []

  for (const network of NETWORKS) {
    const local = getLocalRegistry(network)
    const remote = await fetchRegistry(network, { silent: true })

    const { hasChanges, added, removed } = compareRegistries(local, remote)

    if (hasChanges) {
      hasUpdates = true
      const localCount = local ? local.length : 0
      updates.push(
        `  - ${network}.json: local has ${localCount} tokens, remote has ${remote.length} (+${added}/-${removed})`,
      )
    }
  }

  if (hasUpdates) {
    console.error('\n❌ Token registry is out of date!\n')
    console.error('Updates available:')
    updates.forEach(u => console.error(u))
    console.error('\nPlease run the following command to update:\n')
    console.error('  pnpm token-registry:update\n')
    console.error('Then stage the updated files and commit again.\n')
    process.exit(1)
  }

  console.log('✓ Token registry is up to date.')
}

main().catch(err => {
  console.error('Error checking token registry:', err.message)
  // Don't fail the commit if we can't reach the registry
  console.error('Warning: Could not verify token registry. Proceeding with commit.')
  process.exit(0)
})
