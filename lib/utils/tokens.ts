import { KNOWN_TOKEN_SYMBOLS, TOKEN_API_SLUGS } from '@/lib/constants/tokens'
import type { TokenDailyPricesToken } from '@/hooks/useTokenDailyPrices'

/**
 * Get the icon path for a token symbol
 */
export const getTokenIconPath = (symbol: string): string | undefined => {
  const normalizedSymbol = symbol.toUpperCase()
  if (KNOWN_TOKEN_SYMBOLS.includes(normalizedSymbol as (typeof KNOWN_TOKEN_SYMBOLS)[number])) {
    return `/tokens/${normalizedSymbol}.svg`
  }
  return undefined
}

/**
 * Map token symbols to API slugs for useTokenDailyPrices
 */
export const getTokenSlug = (symbol: string): TokenDailyPricesToken => {
  const normalizedSymbol = symbol.toUpperCase()
  if (normalizedSymbol in TOKEN_API_SLUGS) {
    return TOKEN_API_SLUGS[normalizedSymbol as keyof typeof TOKEN_API_SLUGS]
  }
  return symbol.toLowerCase()
}
