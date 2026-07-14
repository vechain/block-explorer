import type { AddressString } from '@/lib/schemas'
import { useContractSniff } from '@/hooks/useContractSniff'
import { useIsErc721 } from '@/services/thor/tokens/erc721'

/**
 * Detects whether an address is an ERC-721 contract.
 *
 * Primary signal is an on-chain ERC-165 `supportsInterface` call, which works
 * through proxies (most collections are proxy-deployed). Bytecode sniffing is
 * kept as a fallback for older collections that predate ERC-165.
 */
export const useIsErc721Contract = (
  address: AddressString | null | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): boolean => {
  const shouldRun = enabled && !!address
  const { data: supportsErc721 } = useIsErc721({ contractAddress: address as AddressString, enabled: shouldRun })
  const { data: sniffed } = useContractSniff(shouldRun ? address : undefined)
  return supportsErc721 === true || sniffed === 'erc721'
}
