import { describe, it, expect } from 'vitest'
import { truncateHex, isHexString } from './truncateHex'

describe('isHexString', () => {
  it('returns true for a valid hex string with 0x', () => {
    expect(isHexString('0x123abc')).toBe(true)
  })

  it('returns false for non-hex string', () => {
    expect(isHexString('xyz123')).toBe(false)
    expect(isHexString('123g')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isHexString('')).toBe(false)
  })
})

describe('truncateHex', () => {
  it('returns truncated string for valid hex', () => {
    expect(truncateHex('0x123456789abcdef0')).toBe('0x123456...bcdef0')
  })

  it('returns truncated string with custom lengths', () => {
    expect(truncateHex('0xDEADBEEF', 2, 6)).toBe('0x...ADBEEF')
    expect(truncateHex('0x123456789abcdef0', 8, 0)).toBe('0x123456...') // No end portion, just ellipsis
  })

  it('returns empty string for invalid hex', () => {
    expect(truncateHex('xyz123')).toBe('xyz123')
    expect(truncateHex('')).toBe('')
  })
})
