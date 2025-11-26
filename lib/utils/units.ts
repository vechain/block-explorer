import { formatEther, formatGwei, formatUnits, hexToBigInt } from 'viem'
import { type HexString, hexStringSchema } from '@/lib/schemas'

export const formatHexToGwei = (value: string) => {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatGwei(hexToBigInt(result.data))
}

export const formatAmount = ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
  const bigIntAmount = typeof amount === 'bigint' ? amount : hexToBigInt(amount)

  const fullAmount = formatUnits(bigIntAmount, decimals ?? 18)

  // Check if it's an integer
  if (!fullAmount.includes('.')) {
    return [fullAmount, fullAmount]
  }

  // Split to get the decimal parts
  const [_, decimalPart] = fullAmount.split('.')
  // Remove trailing zeros from decimal part
  const significantDigits = decimalPart.replace(/0+$/, '')
  // If there are 4 or more non 0 digits after decimal, show 4 decimal places
  const fixed = significantDigits.length <= 4 ? significantDigits.length : 4

  return [Number(fullAmount).toFixed(fixed), fullAmount]
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
export const formatAbbreviated = (amount: bigint) => {
  const amountString = formatEther(amount)
  const [intPart] = amountString.split('.')
  const num = Number(intPart)

  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    const millions = num / 1_000_000
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (num >= 1_000) {
    const thousands = num / 1_000
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
  }
  return num.toLocaleString()
}
