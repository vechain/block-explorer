'use client'

import { useCallback } from 'react'
import type { HexString } from '@/lib/schemas'
import { useLocale } from './useLocale'
import { useSettingsStore } from '@/lib/stores/settings'
import { formatAmount, formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/utils/units'
import { formatDateFromTimestamp } from '@/lib/utils/date'

/**
 * Hook to format numbers using the current locale
 * @returns A function that formats numbers with locale-specific formatting
 */
export const useFormatNumber = () => {
  const locale = useLocale()

  return useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return formatNumber(num, locale, options)
    },
    [locale],
  )
}

/**
 * Hook to format dates using the current locale
 * @returns A function that formats dates with locale-specific formatting
 */
export const useFormatDate = () => {
  const locale = useLocale()

  return useCallback(
    (timestamp: number, options?: Intl.DateTimeFormatOptions): string => {
      return formatDateFromTimestamp(timestamp, locale, options)
    },
    [locale],
  )
}

/**
 * Hook to format currency using the current locale
 * @returns A function that formats numbers as currency with locale-specific formatting
 */
export const useFormatCurrency = () => {
  const locale = useLocale()
  const { currency: selectedCurrency } = useSettingsStore()

  return useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return formatCurrency(num, locale, selectedCurrency, options)
    },
    [locale, selectedCurrency],
  )
}

/**
 * Hook that formats a bigint amount (in wei) as an abbreviated string with appropriate suffix.
 * Automatically uses the current locale from the route.
 *
 * Converts the amount from wei to ether, then formats it with:
 * - "B" suffix for billions (>= 1,000,000,000)
 * - "M" suffix for millions (>= 1,000,000)
 * - "K" suffix for thousands (>= 1,000)
 * - Standard locale formatting for values < 1,000
 *
 * @returns A function that takes an amount in wei and returns a formatted string
 *
 * @example
 * ```tsx
 * const formatAbbreviated = useFormatAbbreviated()
 * formatAbbreviated(BigInt('1500000000000000000')) // "1.5B"
 * formatAbbreviated(BigInt('500000000000000000'))  // "500M"
 * ```
 */
// const useFormatAbbreviated = () => {
//   const locale = useLocale()

//   return useCallback(
//     (amount: bigint): string => {
//       return formatAbbreviated(amount, locale)
//     },
//     [locale],
//   )
// }

/**
 * Hook that formats token amounts with proper decimal handling and locale-specific formatting.
 * Automatically uses the current locale from the route.
 *
 * Returns a tuple of [formattedAmount, fullAmount] where:
 * - formattedAmount: Locale-formatted string with appropriate decimal places (max 4)
 * - fullAmount: Full precision string representation
 *
 * @returns A function that takes amount and optional decimals, returns [formatted, full]
 *
 * @example
 * ```tsx
 * const formatAmount = useFormatAmount()
 * const [formatted, full] = formatAmount({ amount: BigInt('1234567890000000000'), decimals: 18 })
 * // formatted: "1.2346" (with locale-specific separators)
 * // full: "1.23456789"
 * ```
 */
export const useFormatCompactCurrency = () => {
  const locale = useLocale()
  const { currency: selectedCurrency } = useSettingsStore()

  return useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return formatCompactCurrency(num, locale, selectedCurrency, options)
    },
    [locale, selectedCurrency],
  )
}

export const useFormatAmount = () => {
  const locale = useLocale()

  return useCallback(
    ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
      return formatAmount({ amount, decimals, locale })
    },
    [locale],
  )
}
