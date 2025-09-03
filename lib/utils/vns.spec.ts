import { describe, expect, it } from 'vitest'
import { normalizeName } from './vns'

describe('Vns utils', () => {
  describe('normalizeName', () => {
    it('should trim and lowercase the name and add .vet postfix if not present', () => {
      expect(normalizeName(' Example ')).toBe('example.vet')
      expect(normalizeName('example.vet')).toBe('example.vet')
      expect(normalizeName(' example.vet ')).toBe('example.vet')
      expect(normalizeName('EXAMPLE.VET')).toBe('example.vet')
    })
  })
})
