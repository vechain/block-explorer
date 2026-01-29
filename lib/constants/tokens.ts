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

// Token contract addresses (mainnet)
export const TOKEN_CONTRACT_ADDRESSES = {
  VTHO: '0x0000000000000000000000000000456E65726779',
  B3TR: '0x5ef79995FE8a89e0812330E4378eB2660ceDe699',
  VOT3: '0x76Ca782B59C74d088C7D2Cce2f211BC00836c602',
} as const

export type TokenFilterKey = 'ALL' | 'VET' | 'VTHO' | 'B3TR' | 'VOT3'
