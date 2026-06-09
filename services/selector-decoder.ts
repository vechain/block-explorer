'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { AbiItem } from 'viem'
import type { HexString } from '@/lib/schemas'

type SelectorKind = 'function' | 'event'

// Mirror of DecodedSelector in lib/selector-decoder. Discriminated so the
// caller knows whether it received a ready-to-use ABI fragment (b32) or a
// bare signature it has to interpret (OpenChain).
type DecodedSelector = { source: 'b32'; abi: AbiItem } | { source: 'openchain'; signature: string }

const SELECTOR_QUERY_KEY = 'getDecodedSelector'

const fetchDecodedSelector = async (kind: SelectorKind, hash: HexString): Promise<DecodedSelector | null> => {
  try {
    const response = await fetch(`/api/decode/selector?kind=${kind}&hash=${hash.toLowerCase()}`)
    if (!response.ok) return null
    return (await response.json()) as DecodedSelector
  } catch {
    return null
  }
}

const decodedSelectorQueryOptions = (kind: SelectorKind, hash: HexString | null | undefined) =>
  queryOptions({
    queryKey: [SELECTOR_QUERY_KEY, kind, hash?.toLowerCase()],
    queryFn: hash ? () => fetchDecodedSelector(kind, hash) : skipToken,
    staleTime: Infinity,
  })

export const useDecodedSelector = (kind: SelectorKind, hash: HexString | null | undefined) =>
  useQuery(decodedSelectorQueryOptions(kind, hash))

export { fetchDecodedSelector as getDecodedSelector }
