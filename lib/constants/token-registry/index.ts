import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import mainTokens from './main.json'
import testTokens from './test.json'

/**
 * Token entry from the vechain/token-registry
 */
type TokenRegistryEntry = {
  name: string
  symbol: string
  decimals: number
  address: string
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
 * Get token info from the registry by network and address.
 * Returns null if the token is not in the registry.
 */
export function getTokenInfo(networkName: NetworkName, address: AddressString): TokenInfo | null {
  const map = networkName === NetworkName.MAINNET ? mainTokenMap : testTokenMap
  const token = map.get(address.toLowerCase())

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
  const symbolMap = networkName === NetworkName.MAINNET ? mainTokenBySymbolMap : testTokenBySymbolMap
  const nameMap = networkName === NetworkName.MAINNET ? mainTokenByNameMap : testTokenByNameMap
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
