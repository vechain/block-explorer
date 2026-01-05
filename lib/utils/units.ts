import { formatEther, formatGwei, formatUnits, hexToBigInt } from 'viem'
import { type HexString, hexStringSchema } from '@/lib/schemas'
import { Locale } from '@/i18n/config'

/**
 * Cache for Intl.NumberFormat instances to avoid expensive re-creation on every call.
 * The Intl.NumberFormat constructor is costly - caching improves performance significantly
 * for high-frequency formatting (charts, tables, lists).
 */
const numberFormatCache = new Map<string, Intl.NumberFormat>()

/**
 * Gets a cached Intl.NumberFormat instance or creates one if not cached.
 * Cache key is derived from locale + stringified options.
 */
const getNumberFormatter = (locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat => {
  const key = options ? `${locale}:${JSON.stringify(options)}` : locale
  let formatter = numberFormatCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    numberFormatCache.set(key, formatter)
  }
  return formatter
}

export const formatHexToGwei = (value: string) => {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatGwei(hexToBigInt(result.data))
}

export const formatAmount = ({
  amount,
  decimals,
  locale,
}: {
  amount: bigint | HexString
  decimals?: number
  locale?: Locale
}) => {
  const bigIntAmount = typeof amount === 'bigint' ? amount : hexToBigInt(amount)

  const fullAmount = formatUnits(bigIntAmount, decimals ?? 18)

  const effectiveLocale = locale || Locale.EN

  // Check if it's an integer
  if (!fullAmount.includes('.')) {
    const formattedInteger = getNumberFormatter(effectiveLocale).format(Number(fullAmount))
    return [formattedInteger, fullAmount]
  }

  // Split to get the decimal parts
  const [, decimalPart] = fullAmount.split('.')
  // Remove trailing zeros from decimal part
  const significantDigits = decimalPart.replace(/0+$/, '')
  // If there are 4 or more non 0 digits after decimal, show 4 decimal places
  const fixed = significantDigits.length <= 4 ? significantDigits.length : 4

  // Format with locale-specific thousands separators
  const formattedNumber = getNumberFormatter(effectiveLocale, {
    minimumFractionDigits: fixed,
    maximumFractionDigits: fixed,
  }).format(Number(fullAmount))

  return [formattedNumber, fullAmount]
}

/**
 * Formats a bigint amount (in wei) as an abbreviated string with appropriate suffix.
 *
 * Converts the amount from wei to ether, then formats it with:
 * - "B" suffix for billions (>= 1,000,000,000)
 * - "M" suffix for millions (>= 1,000,000)
 * - "K" suffix for thousands (>= 1,000)
 * - Standard locale formatting for values < 1,000
 *
 * The function shows whole numbers when the abbreviated value is an integer,
 * otherwise shows one decimal place. For values less than 1,000, uses standard
 * number formatting with locale-specific separators.
 *
 * @param amount - The amount in wei (as a bigint)
 * @returns A formatted string with appropriate abbreviation suffix (K, M, B) or standard formatting
 *
 * @example
 * ```ts
 * formatAbbreviated(BigInt('1500000000000000000')) // "1.5B"
 * formatAbbreviated(BigInt('500000000000000000'))  // "500M"
 * formatAbbreviated(BigInt('2500000000000000'))    // "2.5K"
 * formatAbbreviated(BigInt('500000000000000'))      // "500"
 * ```
 */
export const formatAbbreviated = (amount: bigint, locale: Locale = Locale.EN) => {
  // Convert to number for compact display (precision loss acceptable for abbreviation)
  const num = Number(formatEther(amount))

  return getNumberFormatter(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num)
}

/**
 * Formats a number using locale-specific formatting (thousands separators, decimal separators, etc.)
 *
 * @param num - The number to format
 * @param locale - The locale to use for formatting (defaults to 'en')
 * @param options - Optional Intl.NumberFormatOptions for customization
 * @returns A formatted string
 *
 * @example
 * ```ts
 * formatNumber(1234567.89, 'en') // "1,234,567.89"
 * formatNumber(1234567.89, 'de') // "1.234.567,89"
 * formatNumber(1234567.89, 'fr') // "1 234 567,89"
 * ```
 */
export const formatNumber = (num: number, locale?: Locale, options?: Intl.NumberFormatOptions): string => {
  return getNumberFormatter(locale || Locale.EN, options).format(num)
}

/**
 * Formats a number as currency using locale-specific formatting
 *
 * @param num - The number to format
 * @param locale - The locale to use for formatting (defaults to 'en')
 * @param currency - The currency code (e.g., 'USD', 'EUR', 'CNY')
 * @param options - Optional Intl.NumberFormatOptions for customization
 * @returns A formatted currency string
 *
 * @example
 * ```ts
 * formatCurrency(1234.56, 'en', 'USD') // "$1,234.56"
 * formatCurrency(1234.56, 'de', 'EUR') // "1.234,56 €"
 * formatCurrency(1234.56, 'en', 'USD', { minimumFractionDigits: 2 }) // "$1,234.56"
 * ```
 */
export const formatCurrency = (
  num: number,
  locale: Locale | undefined,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string => {
  return getNumberFormatter(locale || Locale.EN, {
    style: 'currency',
    currency,
    ...options,
  }).format(num)
}
