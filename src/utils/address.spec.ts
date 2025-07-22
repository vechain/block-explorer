import { describe, it, expect } from "vitest"
import { isZeroAddress, parseAddress, truncateAddress } from "./address"
import { Address, ZERO_ADDRESS } from "@vechain/sdk-core"

describe("Address utils", () => {
  describe("isZeroAddress", () => {
    it("should return true for zero address string", () => {
      expect(isZeroAddress(ZERO_ADDRESS)).toBe(true)
    })

    it("should return true for zero address Address object", () => {
      const zeroAddress = Address.of(ZERO_ADDRESS)
      expect(isZeroAddress(zeroAddress)).toBe(true)
    })

    it("should return false for non-zero address string", () => {
      expect(isZeroAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(false)
    })

    it("should return false for non-zero address Address object", () => {
      const nonZeroAddress = Address.of("0x1234567890abcdef1234567890abcdef12345678")
      expect(isZeroAddress(nonZeroAddress)).toBe(false)
    })

    it("should return true if zero address missing prefix", () => {
      const zeroAddress = ZERO_ADDRESS.slice(2)
      expect(isZeroAddress(zeroAddress)).toBe(true)
    })
  })

  describe("parseAddress", () => {
    it("should return the address for a valid address string", () => {
      const addressString = "0x1234567890abcdef1234567890abcdef12345678"
      const address = parseAddress(addressString)
      expect(address).toEqual(Address.of(addressString))
    })

    it("should return undefined for an invalid address string", () => {
      const address = parseAddress("invalidAddress")
      expect(address).toBeUndefined()
    })

    it("should return undefined for an undefined address", () => {
      const address = parseAddress(undefined)
      expect(address).toBeUndefined()
    })
  })

  describe("truncateAddress", () => {
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678"

    it("should truncate address with default parameters", () => {
      const result = truncateAddress(testAddress)
      expect(result).toBe("0x12345678...12345678")
    })

    it("should truncate address with custom parameters", () => {
      const result = truncateAddress(testAddress, 8, 6)
      expect(result).toBe("0x123456...345678")
    })

    it("should not truncate short addresses", () => {
      const shortAddress = "0x123456"
      const result = truncateAddress(shortAddress)
      expect(result).toBe(shortAddress)
    })
  })
})
