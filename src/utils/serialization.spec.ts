import { describe, it, expect } from "vitest"
import { serializeZodParams } from "./serialization"

describe("serializeZodParams", () => {
  it("should serialize a Zod schema object to search params format", () => {
    const params = {
      origin: "0x1234567890",
      includeDelegated: true,
      expanded: true,
      page: 1,
      size: 10,
      direction: "ASC",
    }
    const serialized = serializeZodParams(params)
    expect(serialized).toEqual({
      origin: "0x1234567890",
      includeDelegated: "true",
      expanded: "true",
      page: "1",
      size: "10",
      direction: "ASC",
    })
  })

  it("should serialize a Zod schema object to search params format with optional fields", () => {
    const params = {
      origin: "0x1234567890",
      includeDelegated: true,
      expanded: undefined,
      page: 1,
      size: 10,
      direction: "ASC",
    }
    const serialized = serializeZodParams(params)
    expect(serialized).toEqual({
      origin: "0x1234567890",
      includeDelegated: "true",
      page: "1",
      size: "10",
      direction: "ASC",
    })
  })
})
