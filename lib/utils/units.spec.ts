import { describe, expect, it } from 'vitest'
import { formatAbbreviated, formatAmount, formatHexToGwei } from './units'

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

  describe('formatAbbreviated', () => {
    it('should format billions with B suffix', () => {
      // 1B ether = 10^9 * 10^18 wei = 10^27 wei
      expect(formatAbbreviated(BigInt('1000000000000000000000000000'))).toBe('1B')
      // 1.5B ether = 1.5 * 10^9 * 10^18 wei = 1.5 * 10^27 wei
      expect(formatAbbreviated(BigInt('1500000000000000000000000000'))).toBe('1.5B')
      // 2.5B ether = 2.5 * 10^9 * 10^18 wei = 2.5 * 10^27 wei
      expect(formatAbbreviated(BigInt('2500000000000000000000000000'))).toBe('2.5B')
      // 999.9B ether = 999.9 * 10^9 * 10^18 wei = 999900000000 * 10^18 wei (30 digits)
      expect(formatAbbreviated(BigInt('999900000000000000000000000000'))).toBe('999.9B')
    })

    it('should format millions with M suffix', () => {
      // 1M ether = 10^6 * 10^18 wei = 10^24 wei
      expect(formatAbbreviated(BigInt('1000000000000000000000000'))).toBe('1M')
      // 1.5M ether = 1.5 * 10^6 * 10^18 wei = 1.5 * 10^24 wei
      expect(formatAbbreviated(BigInt('1500000000000000000000000'))).toBe('1.5M')
      // 500M ether = 500 * 10^6 * 10^18 wei = 5 * 10^26 wei
      expect(formatAbbreviated(BigInt('500000000000000000000000000'))).toBe('500M')
      // 999.9M ether = 999.9 * 10^6 * 10^18 wei = 999900000 * 10^18 wei
      expect(formatAbbreviated(BigInt('999900000000000000000000000'))).toBe('999.9M')
    })

    it('should format thousands with K suffix', () => {
      // 1K ether = 10^3 * 10^18 wei = 10^21 wei
      expect(formatAbbreviated(BigInt('1000000000000000000000'))).toBe('1K')
      // 1.5K ether = 1.5 * 10^3 * 10^18 wei = 1.5 * 10^21 wei
      expect(formatAbbreviated(BigInt('1500000000000000000000'))).toBe('1.5K')
      // 500K ether = 500 * 10^3 * 10^18 wei = 5 * 10^23 wei
      expect(formatAbbreviated(BigInt('500000000000000000000000'))).toBe('500K')
      // 999.9K ether = 999.9 * 10^3 * 10^18 wei = 999900 * 10^18 wei
      expect(formatAbbreviated(BigInt('999900000000000000000000'))).toBe('999.9K')
    })

    it('should format values less than 1000 with standard locale formatting', () => {
      // 100 ether = 100 * 10^18 wei = 10^20 wei
      expect(formatAbbreviated(BigInt('100000000000000000000'))).toBe('100')
      // 50 ether = 50 * 10^18 wei = 5 * 10^19 wei
      expect(formatAbbreviated(BigInt('50000000000000000000'))).toBe('50')
      // 1 ether = 10^18 wei
      expect(formatAbbreviated(BigInt('1000000000000000000'))).toBe('1')
      expect(formatAbbreviated(BigInt('0'))).toBe('0')
    })

    it('should handle edge cases at boundaries', () => {
      // Exactly 1 billion ether
      expect(formatAbbreviated(BigInt('1000000000000000000000000000'))).toBe('1B')
      // Just below 1 billion ether (999.9M)
      expect(formatAbbreviated(BigInt('999900000000000000000000000'))).toBe('999.9M')
      // Exactly 1 million ether
      expect(formatAbbreviated(BigInt('1000000000000000000000000'))).toBe('1M')
      // Just below 1 million ether (999.9K)
      expect(formatAbbreviated(BigInt('999900000000000000000000'))).toBe('999.9K')
      // Exactly 1 thousand ether
      expect(formatAbbreviated(BigInt('1000000000000000000000'))).toBe('1K')
      // Just below 1 thousand ether (999)
      expect(formatAbbreviated(BigInt('999000000000000000000'))).toBe('999')
    })
  })
})
