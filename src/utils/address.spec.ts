import { describe, it, expect } from "vitest"
import { parseAddress } from "./address"
import { Address } from "@vechain/sdk-core"

describe("Address utils", () => {
  describe("parseAddress", () => {
    it("should return the address for a valid address string", () => {
      const addressString = "0x1234567890abcdef1234567890abcdef12345678"
      const address = parseAddress(addressString)
      expect(address).toBe(Address.of(addressString))
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
})
