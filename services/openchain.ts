'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { HexString } from '@/lib/schemas'

type OpenChainKind = 'function' | 'event'

const OPENCHAIN_QUERY_KEY = 'getOpenChainSignature'

const fetchOpenChainSignature = async (kind: OpenChainKind, hash: HexString): Promise<string | null> => {
  try {
    const response = await fetch(`/api/openchain?kind=${kind}&hashes=${hash.toLowerCase()}`)
    if (!response.ok) return null
    const body = (await response.json()) as Record<string, string | null>
    return body[hash.toLowerCase()] ?? null
  } catch {
    return null
  }
}

const openChainSignatureQueryOptions = (kind: OpenChainKind, hash: HexString | null | undefined) =>
  queryOptions({
    queryKey: [OPENCHAIN_QUERY_KEY, kind, hash?.toLowerCase()],
    queryFn: hash ? () => fetchOpenChainSignature(kind, hash) : skipToken,
    staleTime: Infinity,
  })

export const useOpenChainSignature = (kind: OpenChainKind, hash: HexString | null | undefined) =>
  useQuery(openChainSignatureQueryOptions(kind, hash))

export { fetchOpenChainSignature as getOpenChainSignature }
