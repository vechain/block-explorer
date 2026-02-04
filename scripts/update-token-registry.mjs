#!/usr/bin/env node

/**
 * Updates the local token registry files from the official vechain/token-registry.
 *
 * Usage: pnpm token-registry:update
 *
 * This script fetches the latest main.json and test.json from GitHub Pages
 * and writes them to lib/constants/token-registry/
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NETWORKS, REGISTRY_DIR, fetchRegistry, getLocalRegistry, compareRegistries } from './token-registry-utils.mjs'

async function main() {
  console.log('Updating token registry...\n')

  let hasChanges = false

  for (const network of NETWORKS) {
    const local = getLocalRegistry(network)
    const remote = await fetchRegistry(network)

    const { added, removed, unchanged } = compareRegistries(local, remote)

    console.log(`\n${network}.json:`)
    console.log(`  Total tokens: ${remote.length}`)
    console.log(`  Added: ${added}`)
    console.log(`  Removed: ${removed}`)
    console.log(`  Unchanged: ${unchanged}`)

    if (added > 0 || removed > 0) {
      hasChanges = true
    }

    // Write the formatted JSON
    const outputPath = join(REGISTRY_DIR, `${network}.json`)
    writeFileSync(outputPath, JSON.stringify(remote, null, 2) + '\n')
    console.log(`  Written to: ${outputPath}`)
  }

  console.log('\n' + (hasChanges ? 'Token registry updated with changes.' : 'Token registry is up to date.'))
}

main().catch(err => {
  console.error('Error updating token registry:', err.message)
  process.exit(1)
})
