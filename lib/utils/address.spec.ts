import { ZERO_ADDRESS } from '@vechain/sdk-core'
import { describe, expect, it } from 'vitest'
import { isZeroAddress, truncateAddress } from './address'

describe('Address utils', () => {
  describe('isZeroAddress', () => {
    it('should return true for zero address', () => {
      expect(isZeroAddress(ZERO_ADDRESS)).toBe(true)
    })

    it('should return false for non-zero address string', () => {
      expect(isZeroAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(false)
    })
  })

  describe('truncateAddress', () => {
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678'

    it('should truncate address with default parameters', () => {
      const result = truncateAddress(testAddress)
      expect(result).toBe('0x123456...5678')
    })

    it('should truncate address with custom parameters', () => {
      const result = truncateAddress(testAddress, 8, 6)
      expect(result).toBe('0x123456...345678')
    })

    it('should not truncate short addresses', () => {
      const shortAddress = '0x123456'
      const result = truncateAddress(shortAddress)
      expect(result).toBe(shortAddress)
    })
  })
})
