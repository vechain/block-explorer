import z from "zod"
import { Address, HexUInt, ZERO_ADDRESS } from "@vechain/sdk-core"

/**
 * Checks if the address is the zero address
 * @param address
 */
export function isZeroAddress(address: string | Address): boolean {
  let addrToCompare: Address
  if (typeof address === "string") {
    addrToCompare = Address.of(address)
  } else {
    addrToCompare = address
  }

  return addrToCompare.toString().toLowerCase() === ZERO_ADDRESS
}

type AddressValueParam = bigint | number | string | Uint8Array | HexUInt

/**
 * Parses an address from a string, number, bigint, Uint8Array, or HexUInt
 * @param address
 * @returns The parsed address or undefined if the address is invalid
 */
export function parseAddress(value: AddressValueParam | undefined): Address | undefined {
  if (!value) return undefined

  try {
    return Address.of(value)
  } catch (_error) {
    return undefined
  }
}

export const addressStringSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: "Must be a valid address string starting with 0x",
}) as z.ZodType<`0x${string}`> // 42 characters including 0x

export type AddressString = z.infer<typeof addressStringSchema>
