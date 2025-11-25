import { describe, expect, it } from 'vitest'
import { formatDateFromTimestamp } from './date'

describe('formatDateFromTimestamp', () => {
  it('should format a valid unix timestamp (seconds) to a locale string', () => {
    const timestamp = 1577836800
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"01/19/1970, 06:17:16 AM"`)
  })

  it('should handle 0 timestamp (epoch)', () => {
    const timestamp = 0
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"01/01/1970, 12:00:00 AM"`)
  })

  it('should handle negative timestamps (before epoch)', () => {
    const timestamp = -1000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"12/31/1969, 11:59:59 PM"`)
  })

  it('should handle future timestamps', () => {
    const timestamp = 32503680000 // year 3000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"01/12/1971, 04:48:00 AM"`)
  })
})
