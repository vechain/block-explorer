import { describe, expect, it } from 'vitest'
import { formatDateFromTimestamp } from './date'

describe('formatDateFromTimestamp', () => {
  it('should format a valid unix timestamp (seconds) to a locale string', () => {
    const timestamp = 1577836800
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"19/01/1970, 06:17:16"`)
  })

  it('should handle 0 timestamp (epoch)', () => {
    const timestamp = 0
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"01/01/1970, 00:00:00"`)
  })

  it('should handle negative timestamps (before epoch)', () => {
    const timestamp = -1000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"31/12/1969, 23:59:59"`)
  })

  it('should handle future timestamps', () => {
    const timestamp = 32503680000 // year 3000
    expect(formatDateFromTimestamp(timestamp)).toMatchInlineSnapshot(`"12/01/1971, 04:48:00"`)
  })
})
