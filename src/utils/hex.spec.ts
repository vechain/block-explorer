import { describe, it, expect } from "vitest"
import { parseHex } from "./hex"
import { Hex } from "@vechain/sdk-core"

describe("Hex utils", () => {
  describe("parseHex", () => {
    it("should return the hex for a valid hex string", () => {
      const hexString = "0xf590b9627456e13e3039625cf7d34f46e4623972c5ce3af596417ba50a124773"
      const hex = parseHex(hexString)
      expect(hex).toBe(Hex.of(hexString))
    })

    it("should return the hex for a valid hex number", () => {
      const hexNumber = 123456
      const hex = parseHex(hexNumber)
      expect(hex).toBe(Hex.of(hexNumber))
    })

    it("should return undefined for an invalid hex string", () => {
      const hex = parseHex("invalidHex")
      expect(hex).toBeUndefined()
    })

    it("should return undefined for an undefined hex", () => {
      const hex = parseHex(undefined)
      expect(hex).toBeUndefined()
    })
  })
})
