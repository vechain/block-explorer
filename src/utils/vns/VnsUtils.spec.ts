// src/utils/vns/VnsUtils.spec.ts
import { describe, it, expect } from "vitest"
import { normalizeName, isZeroAddress } from "./VnsUtils"
import { Address, ZERO_ADDRESS } from "@vechain/sdk-core"

describe("VnsUtils", () => {
  describe("normalizeName", () => {
    it("should trim and lowercase the name and add .vet postfix if not present", () => {
      expect(normalizeName(" Example ")).toBe("example.vet")
      expect(normalizeName("example.vet")).toBe("example.vet")
      expect(normalizeName("EXAMPLE.VET")).toBe("example.vet")
    })
  })

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
})
