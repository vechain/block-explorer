import { hexToBigInt, formatGwei as formatGweiViem, formatEther as formatEtherViem } from "viem"
import { hexStringSchema } from "./hex"

export function formatGwei(value: bigint): string {
  return Number(formatGweiViem(value)).toLocaleString()
}

export function formatEther(value: bigint): string {
  return Number(formatEtherViem(value)).toLocaleString()
}

export function formatHexToGwei(value: string): string {
  const parsedValue = hexStringSchema.parse(value)
  return formatGwei(hexToBigInt(parsedValue))
}

export function formatHexToEther(value: string): string {
  const parsedValue = hexStringSchema.parse(value)
  return formatEther(hexToBigInt(parsedValue))
}
