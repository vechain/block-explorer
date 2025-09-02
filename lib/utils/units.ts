import { formatGwei, formatUnits, hexToBigInt } from 'viem'
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
