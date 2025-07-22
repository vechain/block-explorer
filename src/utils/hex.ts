import { z } from "zod"
import { Hex } from "@vechain/sdk-core"

type HexValueParam = bigint | number | string | Uint8Array

/**
 * Parses a hex from a bigint, number, string  or Uint8Array
 * @param value
 * @returns The parsed revision or undefined if the value is invalid
 */
export function parseHex(value: HexValueParam | undefined): Hex | undefined {
  if (!value) return undefined

  try {
    return Hex.of(value)
  } catch (_error) {
    return undefined
  }
}

export const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]+$/, {
  message: "Must be a valid hex string starting with 0x",
}) as z.ZodType<`0x${string}`>
