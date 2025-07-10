import { Address, HexUInt } from "@vechain/sdk-core"

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
