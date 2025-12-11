import { describe, expect, it } from 'vitest'
import { normalizeSearchTerm } from './useSearch'

describe('normalizeSearchTerm', () => {
  describe('Whitespace handling', () => {
    it('should trim leading whitespace', () => {
      expect(normalizeSearchTerm('   best')).toBe('best')
      expect(normalizeSearchTerm('\tbest')).toBe('best')
      expect(normalizeSearchTerm('\nbest')).toBe('best')
      expect(normalizeSearchTerm('  \t\n best')).toBe('best')
    })

    it('should trim trailing whitespace', () => {
      expect(normalizeSearchTerm('best   ')).toBe('best')
      expect(normalizeSearchTerm('best\t')).toBe('best')
      expect(normalizeSearchTerm('best\n')).toBe('best')
      expect(normalizeSearchTerm('best \t\n  ')).toBe('best')
    })

    it('should trim both leading and trailing whitespace', () => {
      expect(normalizeSearchTerm('  best  ')).toBe('best')
      expect(normalizeSearchTerm('\t\nbest\t\n')).toBe('best')
      expect(normalizeSearchTerm('   \t best \n  ')).toBe('best')
    })

    it('should handle whitespace for hex strings', () => {
      expect(normalizeSearchTerm('  0x1234567890123456789012345678901234567890  ')).toBe(
        '0x1234567890123456789012345678901234567890',
      )
      expect(normalizeSearchTerm('\t1234567890123456789012345678901234567890\t')).toBe(
        '1234567890123456789012345678901234567890',
      )
    })

    it('should handle whitespace for block numbers', () => {
      expect(normalizeSearchTerm('  123456  ')).toBe('123456')
      expect(normalizeSearchTerm('\t999999\n')).toBe('999999')
    })
  })

  describe('British spelling conversion', () => {
    it('should convert "finalised" to "finalized"', () => {
      expect(normalizeSearchTerm('finalised')).toBe('finalized')
    })

    it('should convert "FINALISED" to "finalized"', () => {
      expect(normalizeSearchTerm('FINALISED')).toBe('finalized')
    })

    it('should convert "Finalised" to "finalized"', () => {
      expect(normalizeSearchTerm('Finalised')).toBe('finalized')
    })

    it('should convert "FiNaLiSeD" to "finalized"', () => {
      expect(normalizeSearchTerm('FiNaLiSeD')).toBe('finalized')
    })

    it('should handle "finalised" with whitespace', () => {
      expect(normalizeSearchTerm('  finalised  ')).toBe('finalized')
      expect(normalizeSearchTerm('\tfinalised\n')).toBe('finalized')
    })

    it('should not convert partial matches', () => {
      expect(normalizeSearchTerm('finalisedx')).toBe('finalisedx')
      expect(normalizeSearchTerm('xfinalised')).toBe('xfinalised')
      expect(normalizeSearchTerm('finalised123')).toBe('finalised123')
    })
  })

  describe('Case normalization for keywords', () => {
    it('should normalize "best" variations', () => {
      expect(normalizeSearchTerm('best')).toBe('best')
      expect(normalizeSearchTerm('BEST')).toBe('best')
      expect(normalizeSearchTerm('Best')).toBe('best')
      expect(normalizeSearchTerm('BeSt')).toBe('best')
    })

    it('should normalize "next" variations', () => {
      expect(normalizeSearchTerm('next')).toBe('next')
      expect(normalizeSearchTerm('NEXT')).toBe('next')
      expect(normalizeSearchTerm('Next')).toBe('next')
      expect(normalizeSearchTerm('NeXt')).toBe('next')
    })

    it('should normalize "finalized" variations', () => {
      expect(normalizeSearchTerm('finalized')).toBe('finalized')
      expect(normalizeSearchTerm('FINALIZED')).toBe('finalized')
      expect(normalizeSearchTerm('Finalized')).toBe('finalized')
      expect(normalizeSearchTerm('FiNaLiZeD')).toBe('finalized')
    })

    it('should normalize "justified" variations', () => {
      expect(normalizeSearchTerm('justified')).toBe('justified')
      expect(normalizeSearchTerm('JUSTIFIED')).toBe('justified')
      expect(normalizeSearchTerm('Justified')).toBe('justified')
      expect(normalizeSearchTerm('JuStIfIeD')).toBe('justified')
    })

    it('should handle keywords with whitespace', () => {
      expect(normalizeSearchTerm('  BEST  ')).toBe('best')
      expect(normalizeSearchTerm('\tNext\n')).toBe('next')
      expect(normalizeSearchTerm('  FINALIZED  ')).toBe('finalized')
      expect(normalizeSearchTerm('\t\nJUSTIFIED\t\n')).toBe('justified')
    })
  })

  describe('Hex string preservation', () => {
    it('should preserve case for addresses', () => {
      const address = '0x1234567890AbCdEf1234567890AbCdEf12345678'
      expect(normalizeSearchTerm(address)).toBe(address)
    })

    it('should preserve case for transaction IDs', () => {
      const txId = '0x1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf'
      expect(normalizeSearchTerm(txId)).toBe(txId)
    })

    it('should preserve case for hex strings without 0x prefix', () => {
      const hex = '1234567890AbCdEf1234567890AbCdEf12345678'
      expect(normalizeSearchTerm(hex)).toBe(hex)
    })

    it('should trim whitespace but preserve case for hex strings', () => {
      const address = '0x1234567890AbCdEf1234567890AbCdEf12345678'
      expect(normalizeSearchTerm(`  ${address}  `)).toBe(address)
    })
  })

  describe('Block numbers', () => {
    it('should preserve numeric strings', () => {
      expect(normalizeSearchTerm('123456')).toBe('123456')
      expect(normalizeSearchTerm('0')).toBe('0')
      expect(normalizeSearchTerm('999999999')).toBe('999999999')
    })

    it('should trim whitespace from numeric strings', () => {
      expect(normalizeSearchTerm('  123456  ')).toBe('123456')
      expect(normalizeSearchTerm('\t0\n')).toBe('0')
    })
  })

  describe('VNS domains', () => {
    it('should preserve VNS domain case', () => {
      expect(normalizeSearchTerm('Example.vet')).toBe('Example.vet')
      expect(normalizeSearchTerm('MY-DOMAIN.vet')).toBe('MY-DOMAIN.vet')
    })

    it('should trim whitespace from VNS domains', () => {
      expect(normalizeSearchTerm('  example.vet  ')).toBe('example.vet')
      expect(normalizeSearchTerm('\tmy-domain.vet\n')).toBe('my-domain.vet')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizeSearchTerm('')).toBe('')
    })

    it('should handle whitespace-only string', () => {
      expect(normalizeSearchTerm('   ')).toBe('')
      expect(normalizeSearchTerm('\t\n')).toBe('')
    })

    it('should handle non-keyword strings', () => {
      expect(normalizeSearchTerm('random')).toBe('random')
      expect(normalizeSearchTerm('invalid-keyword')).toBe('invalid-keyword')
      expect(normalizeSearchTerm('123abc')).toBe('123abc')
    })

    it('should handle mixed case non-keywords', () => {
      expect(normalizeSearchTerm('RaNdOm')).toBe('RaNdOm')
      expect(normalizeSearchTerm('Invalid-Keyword')).toBe('Invalid-Keyword')
    })

    it('should handle special characters', () => {
      expect(normalizeSearchTerm('test@example.com')).toBe('test@example.com')
      expect(normalizeSearchTerm('test-123_abc')).toBe('test-123_abc')
    })
  })

  describe('Combined scenarios', () => {
    it('should handle British spelling with case and whitespace', () => {
      expect(normalizeSearchTerm('  FINALISED  ')).toBe('finalized')
      expect(normalizeSearchTerm('\tFinalised\n')).toBe('finalized')
      expect(normalizeSearchTerm('   finalised   ')).toBe('finalized')
    })

    it('should handle keywords with various whitespace combinations', () => {
      expect(normalizeSearchTerm(' \t BEST \n ')).toBe('best')
      expect(normalizeSearchTerm('\n\tNext  \t')).toBe('next')
    })

    it('should preserve complex hex strings with mixed case', () => {
      const complexHex = '0xaBcDeF1234567890aBcDeF1234567890aBcDeF1234567890aBcDeF1234567890'
      expect(normalizeSearchTerm(`  ${complexHex}  `)).toBe(complexHex)
    })
  })
})
