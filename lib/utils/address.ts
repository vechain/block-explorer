import { Address, type HexUInt, ZERO_ADDRESS } from '@vechain/sdk-core'
import { addressStringSchema } from '@/lib/schemas'

/**
 * Checks if the address is the zero address
 * @param address
 */
export const isZeroAddress = (address: string | Address): boolean => {
  let addrToCompare: Address
  if (typeof address === 'string') {
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
export const parseAddress = (value: AddressValueParam | undefined): Address | undefined => {
  if (!value) return undefined

  try {
    return Address.of(value)
  } catch (_error) {
    return undefined
  }
}

/**
 * Truncates an address to show only the beginning and end with "..." in the middle
 * @param address - The address to truncate
 * @param startLength - Number of characters to show at the beginning (default: 6)
 * @param endLength - Number of characters to show at the end (default: 4)
 * @returns The truncated address string
 */
export const truncateAddress = (address: string, startLength: number = 10, endLength: number = 8) => {
  const result = addressStringSchema.safeParse(address)

  if (!result.success) {
    return address
  }

  const start = result.data.slice(0, startLength)
  const end = result.data.slice(-endLength)

  return `${start}...${end}`
}
