import { hexToBigInt, formatGwei, formatUnits } from "viem"
import { HexString, hexStringSchema } from "@/schemas"

export const formatEther = (value: bigint, decimals?: number) => {
  return formatUnits(value, decimals ?? 18)
}

export const formatHexToGwei = (value: string) => {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatGwei(hexToBigInt(result.data))
}

export const formatHexToEther = (value: string, decimals?: number) => {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatEther(hexToBigInt(result.data), decimals)
}

export const formatAmount = ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
  const bigIntAmount = typeof amount === "bigint" ? amount : hexToBigInt(amount)

  const fullAmount = formatEther(bigIntAmount, decimals)

  // Check if it's an integer
  if (!fullAmount.includes(".")) {
    return [fullAmount, fullAmount]
  }

  // Split to get the decimal parts
  const [_, decimalPart] = fullAmount.split(".")
  // Remove trailing zeros from decimal part
  const significantDigits = decimalPart.replace(/0+$/, "")
  // If there are 4 or more non 0 digits after decimal, show 4 decimal places
  const fixed = significantDigits.length <= 4 ? significantDigits.length : 4

  return [Number(fullAmount).toFixed(fixed), fullAmount]
}
