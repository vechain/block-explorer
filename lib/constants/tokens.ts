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
