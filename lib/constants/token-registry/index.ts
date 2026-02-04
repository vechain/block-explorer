import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import mainTokens from './main.json'
import testTokens from './test.json'

/**
 * Base URL for token icons from the vechain token registry
 */
const TOKEN_REGISTRY_ICON_BASE_URL = 'https://vechain.github.io/token-registry/assets/'

/**
 * Social links for a token
 */
type TokenLinks = {
  twitter?: string
  telegram?: string
  medium?: string
  github?: string
}

/**
 * Token entry from the vechain/token-registry
 */
export type TokenRegistryEntry = {
  name: string
  symbol: string
  decimals: number
  address: string
  desc?: string
  icon?: string
  totalSupply?: string
  website?: string
  whitePaper?: string
  links?: TokenLinks
}

/**
 * Token info used for CSV export and display
 */
type TokenInfo = {
  symbol: string
  decimals: number
}

// Build lookup maps for fast access by address
const mainTokenMap = new Map<string, TokenRegistryEntry>()
const testTokenMap = new Map<string, TokenRegistryEntry>()

for (const token of mainTokens as TokenRegistryEntry[]) {
  mainTokenMap.set(token.address.toLowerCase(), token)
}

for (const token of testTokens as TokenRegistryEntry[]) {
  testTokenMap.set(token.address.toLowerCase(), token)
}

/**
 * Get the full token registry entry by network and address.
 * Returns null if the token is not in the registry.
 */
export function getTokenRegistryEntry(networkName: NetworkName, address: AddressString): TokenRegistryEntry | null {
  const map = networkName === NetworkName.MAINNET ? mainTokenMap : testTokenMap
  return map.get(address.toLowerCase()) ?? null
}

/**
 * Get the icon URL for a token from the registry.
 * Returns null if the token has no icon.
 */
export function getTokenIconUrl(icon: string | undefined): string | null {
  if (!icon) return null
  return `${TOKEN_REGISTRY_ICON_BASE_URL}${icon}`
}

/**
 * Get token info from the registry by network and address.
 * Returns null if the token is not in the registry.
 */
export function getTokenInfo(networkName: NetworkName, address: AddressString): TokenInfo | null {
  const token = getTokenRegistryEntry(networkName, address)

  if (!token) {
    return null
  }

  return {
    symbol: token.symbol,
    decimals: token.decimals,
  }
}
