'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { AbiItem } from 'viem'
import type { HexString } from '@/lib/schemas'
import { UpstreamError } from '@/lib/upstream-error'

type SelectorKind = 'function' | 'event'

// Mirror of DecodedSelector in lib/selector-decoder. Discriminated so the
// caller knows whether it received a ready-to-use ABI fragment (b32) or a
// bare signature it has to interpret (OpenChain).
type DecodedSelector = { source: 'b32'; abi: AbiItem } | { source: 'openchain'; signature: string }

const SELECTOR_QUERY_KEY = 'getDecodedSelector'

// The route's own max-age: re-asked eventually, since a swallowed failure reads as an answer.
const CACHE_TIME_MS = 60 * 60 * 1_000

const fetchDecodedSelector = async (kind: SelectorKind, hash: HexString): Promise<DecodedSelector | null> => {
  const response = await fetch(`/api/decode/selector?kind=${kind}&hash=${hash.toLowerCase()}`)
  // Only the 404 is definitive; the rest the route sends no-store, so throwing keeps it uncached.
  if (response.status === 404) return null
  if (!response.ok) throw new UpstreamError('decode/selector', response.status)

  return (await response.json()) as DecodedSelector
}

const decodedSelectorQueryOptions = (kind: SelectorKind, hash: HexString | null | undefined) =>
  queryOptions({
    queryKey: [SELECTOR_QUERY_KEY, kind, hash?.toLowerCase()],
    queryFn: hash ? () => fetchDecodedSelector(kind, hash) : skipToken,
    staleTime: CACHE_TIME_MS,
    gcTime: CACHE_TIME_MS,
  })

export const useDecodedSelector = (kind: SelectorKind, hash: HexString | null | undefined) =>
  useQuery(decodedSelectorQueryOptions(kind, hash))

export { fetchDecodedSelector as getDecodedSelector }
