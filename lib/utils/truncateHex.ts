import { hexStringSchema } from '../schemas'

export const isHexString = (hex: string): boolean => {
  return hexStringSchema.safeParse(hex).success
}

export const truncateHex = (hex: string, startLength: number = 8, endLength: number = 6) => {
  if (!isHexString(hex)) {
    console.error('Invalid hex string', hex)
    return hex
  }

  return `${hex.slice(0, startLength)}...${endLength ? hex.slice(-endLength) : ''}`
}
