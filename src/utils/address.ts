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

/**
 * Truncates an address to show only the beginning and end with "..." in the middle
 * @param address - The address to truncate
 * @param startLength - Number of characters to show at the beginning (default: 6)
 * @param endLength - Number of characters to show at the end (default: 4)
 * @returns The truncated address string
 */
export function truncateAddress(address: string, startLength: number = 10, endLength: number = 8) {
  const parsedAddress = addressStringSchema.safeParse(address)

  if (!parsedAddress.success) {
    return address
  }

  const start = parsedAddress.data.slice(0, startLength)
  const end = parsedAddress.data.slice(-endLength)

  return `${start}...${end}`
}
