import { describe, expect, it } from 'vitest'
import { normalizeName, stripVnsSuffix } from './vns'

describe('Vns utils', () => {
  describe('normalizeName', () => {
    it('should trim and lowercase the name and add .vet postfix if not present', () => {
      expect(normalizeName(' Example ')).toBe('example.vet')
      expect(normalizeName('example.vet')).toBe('example.vet')
      expect(normalizeName(' example.vet ')).toBe('example.vet')
      expect(normalizeName('EXAMPLE.VET')).toBe('example.vet')
    })
  })

  describe('stripVnsSuffix', () => {
    it('should remove .vet suffix', () => {
      expect(stripVnsSuffix('example.vet')).toBe('example')
      expect(stripVnsSuffix('test.vet')).toBe('test')
    })

    it('should remove .veworld.vet suffix', () => {
      expect(stripVnsSuffix('example.veworld.vet')).toBe('example')
      expect(stripVnsSuffix('test.veworld.vet')).toBe('test')
    })

    it('should prioritize .veworld.vet over .vet', () => {
      expect(stripVnsSuffix('name.veworld.vet')).toBe('name')
    })

    it('should return name unchanged if no suffix present', () => {
      expect(stripVnsSuffix('example')).toBe('example')
    })

    it('should handle empty string', () => {
      expect(stripVnsSuffix('')).toBe('')
    })

    it('should handle names with dots in them', () => {
      expect(stripVnsSuffix('my.cool.name.vet')).toBe('my.cool.name')
      expect(stripVnsSuffix('my.name.veworld.vet')).toBe('my.name')
    })
  })
})
