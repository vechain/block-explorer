import { hexToBigInt, formatGwei as formatGweiViem, formatEther as formatEtherViem } from "viem"
import { hexStringSchema } from "@/schemas"

export const formatGwei = (value: bigint): string => {
  return Number(formatGweiViem(value)).toLocaleString()
}

export const formatEther = (value: bigint): string => {
  return Number(formatEtherViem(value)).toLocaleString()
}

export function formatHexToGwei(value: string): string {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatGwei(hexToBigInt(result.data))
}

export function formatHexToEther(value: string): string {
  const result = hexStringSchema.safeParse(value)
  if (!result.success) {
    return value
  }

  return formatEther(hexToBigInt(result.data))
}
