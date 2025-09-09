import { ZERO_ADDRESS } from '@vechain/sdk-core'
import { type AddressString, addressStringSchema } from '@/lib/schemas'

/**
 * Checks if the address is the zero address
 * @param address
 */
export const isZeroAddress = (address: AddressString): boolean => {
  return address.toLowerCase() === ZERO_ADDRESS
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
