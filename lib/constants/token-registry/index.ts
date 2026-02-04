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

for (const token of mainTokens as TokenRegistryEntry[]) {
  mainTokenMap.set(token.address.toLowerCase(), token)
}

for (const token of testTokens as TokenRegistryEntry[]) {
  testTokenMap.set(token.address.toLowerCase(), token)
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
