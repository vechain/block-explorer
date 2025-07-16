import { describe, it, expect } from "vitest"
import { formatDateFromTimestamp } from "./date"

describe("formatDateFromTimestamp", () => {
  it("should format a valid unix timestamp (seconds) to a locale string", () => {
    const timestamp = 1577836800
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"1/1/2020, 1:00:00 AM"`)
  })

  it("should handle 0 timestamp (epoch)", () => {
    const timestamp = 0
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"1/1/1970, 1:00:00 AM"`)
  })

  it("should handle negative timestamps (before epoch)", () => {
    const timestamp = -1000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"1/1/1970, 12:43:20 AM"`)
  })

  it("should handle future timestamps", () => {
    const timestamp = 32503680000 // year 3000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"1/1/3000, 1:00:00 AM"`)
  })
})
