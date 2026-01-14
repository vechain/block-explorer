import type { AddressString } from '@/lib/schemas'

/**
 * Token-related constants
 */

// Standard token decimals (VET and VTHO both use 18 decimals)
export const NATIVE_TOKEN_DECIMALS = 18

// Maximum number of tokens to fetch per account
export const MAX_TOKENS_PER_ACCOUNT = 100

// Known token symbols that have icons
export const KNOWN_TOKEN_SYMBOLS = ['VET', 'VTHO', 'B3TR', 'VOT3'] as const

// Token symbol to API slug mapping
export const TOKEN_API_SLUGS = {
  VET: 'vechain',
  VTHO: 'vethor-token',
  B3TR: 'vebetterdao',
  VOT3: 'vebetterdao',
} as const

// Well-known token contracts with their metadata (mainnet)
// Used as fallback when ERC20 contract calls fail or are pending
const KNOWN_TOKENS_MAINNET: Record<AddressString, { symbol: string; decimals: number }> = {
  '0x0000000000000000000000000000456e65726779': { symbol: 'VTHO', decimals: 18 },
  '0x5ef79995FE8a89e0812330E4378eB2660ceDe699': { symbol: 'B3TR', decimals: 18 },
  '0x76Ca782B59C74d088C7D2Cce2f211BC00836c602': { symbol: 'VOT3', decimals: 18 },
  '0x170F4BA8e7ACF6510f55dB26047C83D13498AF8A': { symbol: 'VEX', decimals: 18 },
  '0xacc280010b2ee0efc770bce34774376656d8ce14': { symbol: 'HAI', decimals: 8 },
  '0x1b8ec6c2a45cca481da6f243df0d7a5744afc1f8': { symbol: 'DBET', decimals: 18 },
  '0x89827f7bb951fd8a56f8ef13c5bfee38522f2e1f': { symbol: 'PLA', decimals: 18 },
  '0xf8e1faa0367298b55f57ed17f7a2ff3f5f1d1628': { symbol: 'SHA', decimals: 18 },
  '0x0ce6661b4ba86a0ea7ca2bd86a0de87b0b860f14': { symbol: 'OCE', decimals: 18 },
  '0x99763494a7b545f983ee9fe02a3b5441c7ef1396': { symbol: 'YEET', decimals: 18 },
}

// Well-known token contracts (testnet)
const KNOWN_TOKENS_TESTNET: Record<AddressString, { symbol: string; decimals: number }> = {
  '0x0000000000000000000000000000456e65726779': { symbol: 'VTHO', decimals: 18 },
}

/**
 * Get known token info by address and network
 */
export const getKnownToken = (
  address: AddressString,
  network: 'mainnet' | 'testnet',
): { symbol: string; decimals: number } | undefined => {
  const normalizedAddress = address.toLowerCase() as AddressString
  const tokens = network === 'mainnet' ? KNOWN_TOKENS_MAINNET : KNOWN_TOKENS_TESTNET
  return tokens[normalizedAddress]
}
