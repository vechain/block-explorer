import { describe, it, expect } from "vitest"
import { formatHexToGwei, formatHexToEther, formatGwei, formatEther } from "./units"

describe("Units utils", () => {
  describe("formatGwei", () => {
    it("should return the gwei for a valid bigint", () => {
      const bigint = BigInt(10 ** 18)
      const gwei = formatGwei(bigint)
      expect(gwei).toEqual("1,000,000,000")
    })
  })

  describe("formatEther", () => {
    it("should return the ether for a valid bigint", () => {
      const bigint = BigInt(10 ** 18)
      const ether = formatEther(bigint)
      expect(ether).toEqual("1")
    })
  })

  describe("formatHexToGwei", () => {
    it("should return the gwei for a valid hex string", () => {
      const hexString = "0x1000000000000000000"
      const gwei = formatHexToGwei(hexString)
      expect(gwei).toEqual("4,722,366,482,869.646")
    })

    it("should throw an error for an invalid hex string", () => {
      expect(() => formatHexToGwei("invalidHex")).toThrow()
    })
  })

  describe("formatHexToEther", () => {
    it("should return the ether for a valid hex string", () => {
      const hexString = "0x1000000000000000000"
      const ether = formatHexToEther(hexString)
      expect(ether).toEqual("4,722.366")
    })

    it("should throw an error for an invalid hex string", () => {
      expect(() => formatHexToEther("invalidHex")).toThrow()
    })
  })
})
