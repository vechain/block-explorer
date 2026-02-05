/**
 * Token-related constants
 */

// Standard token decimals (VET and VTHO both use 18 decimals)
export const NATIVE_TOKEN_DECIMALS = 18

// Maximum number of tokens to fetch per account
export const MAX_TOKENS_PER_ACCOUNT = 100

/**
 * Token symbols enum for type-safe token references throughout the codebase.
 * Use this instead of hardcoding token symbol strings.
 */
export enum TokenSymbol {
  VET = 'VET',
  VTHO = 'VTHO',
  B3TR = 'B3TR',
  VOT3 = 'VOT3',
}

/**
 * Tokens that should be combined into a single display row.
 * B3TR and VOT3 are 1:1 swappable and represent the same underlying value.
 */
export const COMBINED_TOKENS = {
  /** The primary symbol used for display and price lookups */
  primarySymbol: TokenSymbol.B3TR,
  /** All tokens in this combined group */
  symbols: [TokenSymbol.B3TR, TokenSymbol.VOT3] as const,
  /** Unique key for the combined row */
  key: 'B3TR-VOT3-combined',
  /** Decimals (both B3TR and VOT3 use 18) */
  decimals: 18,
} as const

/**
 * Check if a symbol (case-insensitive) is part of the combined token group.
 */
export const isCombinedToken = (symbol: string): boolean => {
  const normalized = symbol.toUpperCase()
  return COMBINED_TOKENS.symbols.some(t => t === normalized)
}

// Known token symbols that have icons
export const KNOWN_TOKEN_SYMBOLS = [TokenSymbol.VET, TokenSymbol.VTHO, TokenSymbol.B3TR, TokenSymbol.VOT3] as const

// Token symbol to API slug mapping
export const TOKEN_API_SLUGS = {
  [TokenSymbol.VET]: 'vechain',
  [TokenSymbol.VTHO]: 'vethor-token',
  [TokenSymbol.B3TR]: 'vebetterdao',
  [TokenSymbol.VOT3]: 'vebetterdao',
} as const

// Token contract addresses (mainnet)
export const TOKEN_CONTRACT_ADDRESSES = {
  [TokenSymbol.VTHO]: '0x0000000000000000000000000000456E65726779',
  [TokenSymbol.B3TR]: '0x5ef79995FE8a89e0812330E4378eB2660ceDe699',
  [TokenSymbol.VOT3]: '0x76Ca782B59C74d088C7D2Cce2f211BC00836c602',
} as const

export type TokenFilterKey = 'ALL' | TokenSymbol
