import { beforeEach, describe, expect, it, vi } from 'vitest'
import { identifySearchTermType, normalizeSearchTerm, SearchTermType } from './useSearch'
import { getVnsAddress } from '@/services/thor/vns'
import { NetworkName } from '@/lib/constants/network'

// Mock the external dependencies
vi.mock('@/services/thor/account')
vi.mock('@/services/thor/block')
vi.mock('@/services/thor/transaction')
vi.mock('@/services/thor/vns')

const mockGetVnsAddress = vi.mocked(getVnsAddress)

describe('useSearch', () => {
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

  describe('identifySearchTermType', () => {
    describe('VNS Domain', () => {
      it('should identify VNS domains', () => {
        expect(identifySearchTermType('example.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('my-domain.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('test123.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('sub.domain.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('a.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('123.vet')).toBe(SearchTermType.VNS_DOMAIN)
      })

      it('should not identify non-VNS domains', () => {
        expect(identifySearchTermType('example.com')).not.toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('test.eth')).not.toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('vet')).toBe(SearchTermType.UNKNOWN)
      })

      it('should handle VNS domains with whitespace', () => {
        expect(identifySearchTermType('  example.vet  ')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('\tmy-domain.vet\n')).toBe(SearchTermType.VNS_DOMAIN)
      })
    })

    describe('Address', () => {
      it('should identify valid addresses with 0x prefix', () => {
        const validAddress = '0x1234567890123456789012345678901234567890'
        expect(identifySearchTermType(validAddress)).toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('0x1234567890ABCDEF1234567890ABCDEF12345678')).toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('0x1234567890aBcDeF1234567890AbCdEf12345678')).toBe(SearchTermType.ADDRESS)
      })

      it('should identify valid addresses without 0x prefix', () => {
        const validAddress = '1234567890123456789012345678901234567890'
        expect(identifySearchTermType(validAddress)).toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('1234567890ABCDEF1234567890ABCDEF12345678')).toBe(SearchTermType.ADDRESS)
      })

      it('should handle addresses with whitespace', () => {
        expect(identifySearchTermType(' 1234567890123456789012345678901234567890 ')).toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType(' 0x1234567890123456789012345678901234567890 ')).toBe(SearchTermType.ADDRESS)
      })

      it('should not identify invalid addresses', () => {
        expect(identifySearchTermType('0x123')).not.toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('0xGGGG567890123456789012345678901234567890')).not.toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('GGGG567890123456789012345678901234567890')).not.toBe(SearchTermType.ADDRESS)
        expect(identifySearchTermType('123')).not.toBe(SearchTermType.ADDRESS)
      })
    })

    describe('Transaction ID', () => {
      it('should identify valid transaction IDs with 0x prefix', () => {
        const validTxId = '0x30a8a2d5990e21ad2d5bbb2a225038fbe605080473a3b3a16601dbcf2c3c9b62'
        expect(identifySearchTermType(validTxId)).toBe(SearchTermType.TRANSACTION_ID)
        expect(identifySearchTermType('0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF')).toBe(
          SearchTermType.TRANSACTION_ID,
        )
      })

      it('should identify valid transaction IDs without 0x prefix', () => {
        const validTxId = '30a8a2d5990e21ad2d5bbb2a225038fbe605080473a3b3a16601dbcf2c3c9b62'
        expect(identifySearchTermType(validTxId)).toBe(SearchTermType.TRANSACTION_ID)
        expect(identifySearchTermType('1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF')).toBe(
          SearchTermType.TRANSACTION_ID,
        )
      })

      it('should not identify invalid transaction IDs', () => {
        expect(identifySearchTermType('0x123456')).not.toBe(SearchTermType.TRANSACTION_ID)
        expect(identifySearchTermType('123456')).not.toBe(SearchTermType.TRANSACTION_ID)
        expect(identifySearchTermType('GGGG567890123456789012345678901234567890123456789012345678901234')).not.toBe(
          SearchTermType.TRANSACTION_ID,
        )
      })

      it('should prioritize transaction ID over block revision for 64-char hex', () => {
        const longHex = '0x1234567890123456789012345678901234567890123456789012345678901234'
        expect(identifySearchTermType(longHex)).toBe(SearchTermType.TRANSACTION_ID)
      })
    })

    describe('Block Revision', () => {
      it('should identify valid block numbers', () => {
        expect(identifySearchTermType('123456')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('0')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('22000000')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('99999999')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should identify block revision keywords', () => {
        expect(identifySearchTermType('best')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('next')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('finalized')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('justified')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should handle case insensitive keywords', () => {
        expect(identifySearchTermType('BEST')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('Next')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('FINALIZED')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('Justified')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should handle British spelling variations', () => {
        expect(identifySearchTermType('finalised')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('FINALISED')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('Finalised')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('  finalised  ')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should handle whitespace trimming', () => {
        expect(identifySearchTermType('  best  ')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('\t\nfinalized\t\n')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('   finalised   ')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType(' 123456 ')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('\t99999\t')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should handle leading zeros in block numbers', () => {
        expect(identifySearchTermType('000123')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('0000')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should accept decimal numbers that coerce to integers', () => {
        expect(identifySearchTermType('123.0')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('1e5')).toBe(SearchTermType.BLOCK_REVISION) // 100000
      })

      it('should handle short hex strings as block revisions', () => {
        expect(identifySearchTermType('0x1234')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should not identify invalid block revisions', () => {
        expect(identifySearchTermType('abc123')).not.toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('-123')).not.toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('invalid')).not.toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('123.456')).toBe(SearchTermType.UNKNOWN) // Doesn't coerce to int
        expect(identifySearchTermType('1.23e10')).toBe(SearchTermType.UNKNOWN) // Too large
      })
    })

    describe('Priority order verification', () => {
      it('should prioritize VNS domain over other patterns', () => {
        expect(identifySearchTermType('123456.vet')).toBe(SearchTermType.VNS_DOMAIN)
        expect(identifySearchTermType('0x1234567890123456789012345678901234567890.vet')).toBe(SearchTermType.VNS_DOMAIN)
      })

      it('should prioritize address over hex string', () => {
        const address = '0x1234567890123456789012345678901234567890'
        expect(identifySearchTermType(address)).toBe(SearchTermType.ADDRESS)
      })

      it('should prioritize transaction ID over block revision for 64-char hex', () => {
        const longHex = '0x1234567890123456789012345678901234567890123456789012345678901234'
        expect(identifySearchTermType(longHex)).toBe(SearchTermType.TRANSACTION_ID)
      })
    })

    describe('Edge cases and boundary conditions', () => {
      it('should handle minimum valid values', () => {
        expect(identifySearchTermType('0')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('0x0000000000000000000000000000000000000000')).toBe(SearchTermType.ADDRESS)
      })

      it('should handle maximum reasonable values', () => {
        expect(identifySearchTermType('99999999')).toBe(SearchTermType.BLOCK_REVISION)
      })

      it('should handle case sensitivity for hex strings', () => {
        const upperCaseAddress = '0x1234567890ABCDEF1234567890ABCDEF12345678'
        expect(identifySearchTermType(upperCaseAddress)).toBe(SearchTermType.ADDRESS)
        const upperCaseTxId = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF'
        expect(identifySearchTermType(upperCaseTxId)).toBe(SearchTermType.TRANSACTION_ID)
      })

      it('should reject invalid hex characters', () => {
        expect(identifySearchTermType('0x123456789012345678901234567890123456789G')).toBe(SearchTermType.UNKNOWN)
        expect(identifySearchTermType('0x123456789012345678901234567890123456789012345678901234567890123Z')).toBe(
          SearchTermType.UNKNOWN,
        )
      })

      it('should reject negative numbers', () => {
        expect(identifySearchTermType('-1')).toBe(SearchTermType.UNKNOWN)
        expect(identifySearchTermType('-123')).toBe(SearchTermType.UNKNOWN)
      })

      it('should handle edge cases that coerce to valid block numbers', () => {
        // Empty string and whitespace coerce to 0, which is now valid
        expect(identifySearchTermType('')).toBe(SearchTermType.BLOCK_REVISION)
        expect(identifySearchTermType('   ')).toBe(SearchTermType.BLOCK_REVISION)
      })
    })

    describe('Unknown', () => {
      it('should return UNKNOWN for unrecognized formats', () => {
        expect(identifySearchTermType('random text')).toBe(SearchTermType.UNKNOWN)
        expect(identifySearchTermType('0x')).toBe(SearchTermType.UNKNOWN)
        expect(identifySearchTermType('123abc')).toBe(SearchTermType.UNKNOWN)
        expect(identifySearchTermType('invalid-format')).toBe(SearchTermType.UNKNOWN)
      })
    })
  })
  describe('VNS fallback for UNKNOWN terms', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should identify terms without .vet as UNKNOWN (VNS fallback handled by handler)', () => {
      // These should be UNKNOWN - the handler will attempt VNS resolution
      expect(identifySearchTermType('alice')).toBe(SearchTermType.UNKNOWN)
      expect(identifySearchTermType('myname')).toBe(SearchTermType.UNKNOWN)
      expect(identifySearchTermType('some-domain')).toBe(SearchTermType.UNKNOWN)
    })

    it('should still identify terms with .vet as VNS_DOMAIN', () => {
      expect(identifySearchTermType('alice.vet')).toBe(SearchTermType.VNS_DOMAIN)
      expect(identifySearchTermType('myname.vet')).toBe(SearchTermType.VNS_DOMAIN)
    })

    it('should not identify addresses as UNKNOWN (no VNS fallback)', () => {
      // These should be ADDRESS, not UNKNOWN - VNS fallback won't be triggered
      expect(identifySearchTermType('0x1234567890123456789012345678901234567890')).toBe(SearchTermType.ADDRESS)
      expect(identifySearchTermType('1234567890123456789012345678901234567890')).toBe(SearchTermType.ADDRESS)
    })

    it('should not identify transaction IDs as UNKNOWN (no VNS fallback)', () => {
      // These should be TRANSACTION_ID, not UNKNOWN - VNS fallback won't be triggered
      expect(identifySearchTermType('0x1234567890123456789012345678901234567890123456789012345678901234')).toBe(
        SearchTermType.TRANSACTION_ID,
      )
    })

    it('should not identify block revisions as UNKNOWN (no VNS fallback)', () => {
      // These should be BLOCK_REVISION, not UNKNOWN - VNS fallback won't be triggered
      expect(identifySearchTermType('best')).toBe(SearchTermType.BLOCK_REVISION)
      expect(identifySearchTermType('12345')).toBe(SearchTermType.BLOCK_REVISION)
    })
  })
})

// Integration tests for VNS fallback behavior
describe('VNS fallback integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVnsAddress service', () => {
    it('should resolve VNS name to address when VNS exists', async () => {
      const resolvedAddress = '0x1234567890123456789012345678901234567890'
      mockGetVnsAddress.mockResolvedValueOnce(resolvedAddress)

      const result = await mockGetVnsAddress({
        networkName: NetworkName.MAINNET,
        name: 'alice',
      })

      expect(result).toBe(resolvedAddress)
      expect(mockGetVnsAddress).toHaveBeenCalledWith({
        networkName: NetworkName.MAINNET,
        name: 'alice',
      })
    })

    it('should return null when VNS name does not exist', async () => {
      mockGetVnsAddress.mockResolvedValueOnce(null)

      const result = await mockGetVnsAddress({
        networkName: NetworkName.MAINNET,
        name: 'nonexistent',
      })

      expect(result).toBeNull()
    })
  })
})
