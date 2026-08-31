'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { HexString } from '@/lib/schemas'
import { decodeSelector, type SelectorKind } from '@/lib/selector-decoder'

const SELECTOR_QUERY_KEY = 'getDecodedSelector'

// Neither source sends Cache-Control, so this cache is the only one there is.
const GC_TIME_MS = 60 * 60 * 1_000

const decodedSelectorQueryOptions = (kind: SelectorKind, hash: HexString | null | undefined) =>
  queryOptions({
    queryKey: [SELECTOR_QUERY_KEY, kind, hash?.toLowerCase()],
    queryFn: hash ? () => decodeSelector(kind, hash) : skipToken,
    staleTime: Infinity,
    gcTime: GC_TIME_MS,
  })

export const useDecodedSelector = (kind: SelectorKind, hash: HexString | null | undefined) =>
  useQuery(decodedSelectorQueryOptions(kind, hash))
