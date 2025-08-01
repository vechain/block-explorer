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
