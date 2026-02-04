/**
 * Shared utilities for token registry scripts.
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const REGISTRY_BASE_URL = 'https://vechain.github.io/token-registry'
export const REGISTRY_DIR = join(__dirname, '..', 'lib', 'constants', 'token-registry')
export const NETWORKS = ['main', 'test']

/**
 * Fetches the token registry JSON for a network from GitHub Pages.
 */
export async function fetchRegistry(network, { silent = false } = {}) {
  const url = `${REGISTRY_BASE_URL}/${network}.json`
  if (!silent) {
    console.log(`Fetching ${url}...`)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Reads the local token registry JSON for a network.
 * Returns null if the file doesn't exist.
 */
export function getLocalRegistry(network) {
  const path = join(REGISTRY_DIR, `${network}.json`)
  if (!existsSync(path)) {
    return null
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

/**
 * Extracts addresses from a registry as a lowercase Set.
 */
export function getAddressSet(registry) {
  return new Set(registry.map(t => t.address.toLowerCase()))
}

/**
 * Compares local and remote registries and returns diff stats.
 */
export function compareRegistries(local, remote) {
  if (!local) {
    return { added: remote.length, removed: 0, unchanged: 0, hasChanges: remote.length > 0 }
  }

  const localAddresses = getAddressSet(local)
  const remoteAddresses = getAddressSet(remote)

  let added = 0
  let removed = 0
  let unchanged = 0

  for (const addr of remoteAddresses) {
    if (localAddresses.has(addr)) {
      unchanged++
    } else {
      added++
    }
  }

  for (const addr of localAddresses) {
    if (!remoteAddresses.has(addr)) {
      removed++
    }
  }

  return { added, removed, unchanged, hasChanges: added > 0 || removed > 0 }
}
