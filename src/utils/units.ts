import { hexToBigInt, formatGwei as formatGweiViem, formatEther as formatEtherViem } from "viem"
import { hexStringSchema } from "@/schemas"

export const formatGwei = (value: bigint): string => {
  return Number(formatGweiViem(value)).toLocaleString()
}

export const formatEther = (value: bigint): string => {
  return Number(formatEtherViem(value)).toLocaleString()
}

export const formatHexToGwei = (value: string): string => {
  const parsedValue = hexStringSchema.parse(value)
  return formatGwei(hexToBigInt(parsedValue))
}

export const formatHexToEther = (value: string): string => {
  const parsedValue = hexStringSchema.parse(value)
  return formatEther(hexToBigInt(parsedValue))
}
