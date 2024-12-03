import { Address, ZERO_ADDRESS } from "@vechain/sdk-core"

/**
 * Trims and lowercases the name
 * Adds the `.vet` postfix if it's not already there
 * @param name
 */
export const normalizeName = (name: string): string => {
  const nameLower = name.trim().toLowerCase()

  return `${nameLower}${nameLower.endsWith(".vet") ? "" : ".vet"}`
}

/**
 * Checks if the address is the zero address
 * @param address
 */
export const isZeroAddress = (address: string | Address): boolean => {
  let addrToCompare: Address
  if (typeof address === "string") {
    addrToCompare = Address.of(address)
  } else {
    addrToCompare = address
  }

  return addrToCompare.toString().toLowerCase() === ZERO_ADDRESS
}
