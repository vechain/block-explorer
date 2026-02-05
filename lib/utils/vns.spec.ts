import { describe, expect, it } from 'vitest'
import { normalizeName } from './vns'

describe('Vns utils', () => {
  describe('normalizeName', () => {
    describe('adding .vet extension', () => {
      it('should add .vet postfix if not present', () => {
        expect(normalizeName('example')).toBe('example.vet')
        expect(normalizeName('alice')).toBe('alice.vet')
        expect(normalizeName('my-domain')).toBe('my-domain.vet')
      })

      it('should not add .vet if already present', () => {
        expect(normalizeName('example.vet')).toBe('example.vet')
        expect(normalizeName('alice.vet')).toBe('alice.vet')
      })

      it('should add .vet to names with other extensions', () => {
        expect(normalizeName('example.eth')).toBe('example.eth.vet')
        expect(normalizeName('example.com')).toBe('example.com.vet')
      })

      it('should add .vet to names that partially contain "vet"', () => {
        expect(normalizeName('vetname')).toBe('vetname.vet')
        expect(normalizeName('myvet')).toBe('myvet.vet')
        expect(normalizeName('vet')).toBe('vet.vet')
      })
    })

    describe('trimming whitespace', () => {
      it('should trim leading whitespace', () => {
        expect(normalizeName('  example')).toBe('example.vet')
        expect(normalizeName('\texample')).toBe('example.vet')
        expect(normalizeName('\nexample')).toBe('example.vet')
      })

      it('should trim trailing whitespace', () => {
        expect(normalizeName('example  ')).toBe('example.vet')
        expect(normalizeName('example\t')).toBe('example.vet')
        expect(normalizeName('example\n')).toBe('example.vet')
      })

      it('should trim both leading and trailing whitespace', () => {
        expect(normalizeName('  example  ')).toBe('example.vet')
        expect(normalizeName('\t\nexample\t\n')).toBe('example.vet')
        expect(normalizeName(' example.vet ')).toBe('example.vet')
      })
    })

    describe('lowercasing', () => {
      it('should lowercase uppercase names', () => {
        expect(normalizeName('EXAMPLE')).toBe('example.vet')
        expect(normalizeName('ALICE')).toBe('alice.vet')
      })

      it('should lowercase mixed case names', () => {
        expect(normalizeName('Example')).toBe('example.vet')
        expect(normalizeName('ExAmPlE')).toBe('example.vet')
        expect(normalizeName('MyDomain')).toBe('mydomain.vet')
      })

      it('should lowercase the .vet extension', () => {
        expect(normalizeName('example.VET')).toBe('example.vet')
        expect(normalizeName('example.Vet')).toBe('example.vet')
        expect(normalizeName('EXAMPLE.VET')).toBe('example.vet')
      })
    })

    describe('combined scenarios', () => {
      it('should handle whitespace and case together', () => {
        expect(normalizeName(' Example ')).toBe('example.vet')
        expect(normalizeName('  ALICE  ')).toBe('alice.vet')
        expect(normalizeName('\tMyDomain\n')).toBe('mydomain.vet')
      })

      it('should handle whitespace, case, and .vet extension together', () => {
        expect(normalizeName(' Example.VET ')).toBe('example.vet')
        expect(normalizeName('  ALICE.vet  ')).toBe('alice.vet')
      })
    })

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(normalizeName('')).toBe('.vet')
      })

      it('should handle whitespace-only string', () => {
        expect(normalizeName('   ')).toBe('.vet')
        expect(normalizeName('\t\n')).toBe('.vet')
      })

      it('should handle subdomains', () => {
        expect(normalizeName('sub.domain')).toBe('sub.domain.vet')
        expect(normalizeName('sub.domain.vet')).toBe('sub.domain.vet')
      })

      it('should handle names with special characters', () => {
        expect(normalizeName('my-domain')).toBe('my-domain.vet')
        expect(normalizeName('my_domain')).toBe('my_domain.vet')
        expect(normalizeName('domain123')).toBe('domain123.vet')
      })

      it('should handle single character names', () => {
        expect(normalizeName('a')).toBe('a.vet')
        expect(normalizeName('A')).toBe('a.vet')
      })
    })
  })
})
