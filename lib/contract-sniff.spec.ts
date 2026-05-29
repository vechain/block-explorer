import { describe, expect, it } from 'vitest'
import { sniffStandard } from './contract-sniff'

// Build a fake bytecode blob that contains the given 4-byte selectors at
// arbitrary offsets so we can exercise the selector-substring heuristic.
const codeWith = (selectors: string[]): string => '0x60806040526100' + selectors.map(s => s + 'aa').join('00')

describe('sniffStandard', () => {
  it('returns null for empty bytecode', () => {
    expect(sniffStandard('0x')).toBeNull()
    expect(sniffStandard(null)).toBeNull()
    expect(sniffStandard(undefined)).toBeNull()
  })

  it('detects ERC-20 when all required selectors are present', () => {
    expect(sniffStandard(codeWith(['70a08231', 'a9059cbb', '18160ddd', 'dd62ed3e', '095ea7b3', '23b872dd']))).toBe(
      'erc20',
    )
  })

  it('returns null when an ERC-20 selector is missing', () => {
    // Missing `transfer`
    expect(sniffStandard(codeWith(['70a08231', '18160ddd', 'dd62ed3e', '095ea7b3', '23b872dd']))).toBeNull()
  })

  it('detects ERC-721 when all required selectors are present', () => {
    expect(sniffStandard(codeWith(['70a08231', '6352211e', '42842e0e', '23b872dd', '095ea7b3']))).toBe('erc721')
  })

  it('prefers ERC-721 when the contract has both ERC-721-specific and ERC-20 selectors', () => {
    // ownerOf is the discriminator — when present, it's not a plain ERC-20.
    const bytecode = codeWith(['70a08231', '6352211e', '42842e0e', '23b872dd', '095ea7b3', 'a9059cbb'])
    expect(sniffStandard(bytecode)).toBe('erc721')
  })

  it('is case-insensitive', () => {
    const upper = codeWith(['70A08231', 'A9059CBB', '18160DDD', 'DD62ED3E', '095EA7B3', '23B872DD'])
    expect(sniffStandard(upper)).toBe('erc20')
  })
})
