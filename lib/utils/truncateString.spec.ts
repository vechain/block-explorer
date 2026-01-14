import { describe, it, expect } from 'vitest'
import { truncateString } from './truncateString'

describe('truncateString', () => {
  it('returns short strings unchanged', () => {
    expect(truncateString('hello', 20)).toBe('hello')
    expect(truncateString('short', 10, 4)).toBe('short')
  })

  it('returns string unchanged when exactly at maxLength', () => {
    expect(truncateString('12345678901234567890', 20)).toBe('12345678901234567890')
  })

  it('truncates long strings with ellipsis in middle', () => {
    const result = truncateString('this-is-a-very-long-vns-name.vet', 20, 6)
    expect(result).toBe('this-is-a-v...me.vet')
    expect(result.length).toBe(20)
  })

  it('uses default values (maxLength=20, endLength=6)', () => {
    const result = truncateString('abcdefghijklmnopqrstuvwxyz')
    expect(result).toBe('abcdefghijk...uvwxyz')
    expect(result.length).toBe(20)
  })

  it('handles custom endLength', () => {
    const result = truncateString('collection-name-very-long', 16, 4)
    expect(result).toBe('collectio...long')
    expect(result.length).toBe(16)
  })

  it('handles empty string', () => {
    expect(truncateString('')).toBe('')
  })

  it('handles strings just over maxLength', () => {
    const result = truncateString('123456789012345678901', 20, 6)
    expect(result.length).toBe(20)
  })
})
