import { describe, expect, it } from 'vitest'
import { formatAmount, formatHexToGwei } from './units'

describe('Units utils', () => {
  describe('formatHexToGwei', () => {
    it('should return the gwei for a valid hex string', () => {
      const hexString = '0x1000000000000000000'
      const gwei = formatHexToGwei(hexString)
      expect(gwei).toEqual('4722366482869.645213696')
    })

    it('should return the string for an invalid hex string', () => {
      const hexString = 'invalidHex'
      const gwei = formatHexToGwei(hexString)
      expect(gwei).toEqual(hexString)
    })
  })

  describe('formatAmount', () => {
    it('should return the amount for a valid bigint', () => {
      const bigint = BigInt(10 ** 18)
      const amount = formatAmount({ amount: bigint })
      expect(amount).toEqual(['1', '1'])
    })

    it('should return the amount for a valid hex string', () => {
      const hexString = '0x1000000000000000000'
      const amount = formatAmount({ amount: hexString })
      expect(amount).toEqual(['4722.3665', '4722.366482869645213696'])
    })

    it('should return the amount for a valid hex string with decimals and 4 decimal places', () => {
      const hexString = '0x1000000000000000000'
      const amount = formatAmount({ amount: hexString, decimals: 12 })
      expect(amount).toEqual(['4722366482.8696', '4722366482.869645213696'])
    })
  })
})
