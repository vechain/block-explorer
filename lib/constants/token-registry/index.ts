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

// Build separate lookup maps for names and symbols (case-insensitive)
// Using separate maps prevents collisions where a token's symbol could match another token's name
const mainTokenByNameMap = new Map<string, TokenRegistryEntry>()
const mainTokenBySymbolMap = new Map<string, TokenRegistryEntry>()
const testTokenByNameMap = new Map<string, TokenRegistryEntry>()
const testTokenBySymbolMap = new Map<string, TokenRegistryEntry>()

for (const token of mainTokens as TokenRegistryEntry[]) {
  mainTokenMap.set(token.address.toLowerCase(), token)
  mainTokenByNameMap.set(token.name.toLowerCase(), token)
  mainTokenBySymbolMap.set(token.symbol.toLowerCase(), token)
}

for (const token of testTokens as TokenRegistryEntry[]) {
  testTokenMap.set(token.address.toLowerCase(), token)
  testTokenByNameMap.set(token.name.toLowerCase(), token)
  testTokenBySymbolMap.set(token.symbol.toLowerCase(), token)
}

/**
 * Get the full token registry entry by network and address.
 * Returns null if the token is not in the registry.
 */
export function getTokenRegistryEntry(networkName: NetworkName, address: AddressString): TokenRegistryEntry | null {
  const map = networkName === NetworkName.MAINNET ? mainTokenMap : testTokenMap // solo falls back to testnet
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

/**
 * Get token address from the registry by name or symbol (case-insensitive).
 * Prioritizes symbol matches over name matches for more precise lookups.
 * Returns null if no matching token is found.
 */
export function getTokenByNameOrSymbol(networkName: NetworkName, nameOrSymbol: string): { address: string } | null {
  const symbolMap = networkName === NetworkName.MAINNET ? mainTokenBySymbolMap : testTokenBySymbolMap // solo falls back to testnet
  const nameMap = networkName === NetworkName.MAINNET ? mainTokenByNameMap : testTokenByNameMap // solo falls back to testnet
  const key = nameOrSymbol.toLowerCase()

  // Prioritize symbol lookup (symbols are more precise identifiers)
  const token = symbolMap.get(key) ?? nameMap.get(key)

  if (!token) {
    return null
  }

  return {
    address: token.address,
  }
}
