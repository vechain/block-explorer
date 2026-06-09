// Best-effort detection of ERC-20 / ERC-721 contracts based on the
// presence of standard 4-byte selectors in the deployed bytecode. Pure
// heuristic — no chain calls, no interaction with the contract.

import type { HexString } from '@/lib/schemas'

const ERC20_SELECTORS = [
  '70a08231', // balanceOf(address)
  'a9059cbb', // transfer(address,uint256)
  '18160ddd', // totalSupply()
  'dd62ed3e', // allowance(address,address)
  '095ea7b3', // approve(address,uint256)
  '23b872dd', // transferFrom(address,address,uint256)
] as const

const ERC721_SELECTORS = [
  '70a08231', // balanceOf(address)
  '6352211e', // ownerOf(uint256)
  '42842e0e', // safeTransferFrom(address,address,uint256)
  '23b872dd', // transferFrom(address,address,uint256)
  '095ea7b3', // approve(address,uint256)
] as const

type ContractStandard = 'erc20' | 'erc721'

const containsAll = (bytecode: string, selectors: readonly string[]): boolean =>
  selectors.every(sel => bytecode.includes(sel))

export const sniffStandard = (bytecode: HexString | string | null | undefined): ContractStandard | null => {
  if (!bytecode || bytecode === '0x') return null
  // Normalise: lower-cased, no 0x prefix. Selectors appear unaligned in the
  // bytecode, so plain substring search is enough.
  const code = bytecode.toLowerCase().replace(/^0x/, '')
  if (code.length < 8) return null

  // ERC-721 first: it strictly extends a subset of ERC-20 selectors via
  // `transferFrom`/`approve`, but `ownerOf(uint256)` is distinctive and not
  // present on plain ERC-20s.
  if (containsAll(code, ERC721_SELECTORS)) return 'erc721'
  if (containsAll(code, ERC20_SELECTORS)) return 'erc20'
  return null
}
