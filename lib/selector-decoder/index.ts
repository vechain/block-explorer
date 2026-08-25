import type { AbiItem } from 'viem'
import { z } from 'zod'
import { defineEndpoint } from '@/lib/cached-proxy'
import { NotFoundError, UpstreamError } from '@/lib/upstream-error'
import { fetchB32 } from './sources/b32'
import { fetchOpenchain } from './sources/openchain'

const DAY = 86_400
const WEEK = 604_800
const FIVE_MINUTES = 300

// b32 gives a full ABI fragment; OpenChain gives a bare signature the client must
// interpret, since indexed params depend on the caller's topic count.
type DecodedSelector = { source: 'b32'; abi: AbiItem } | { source: 'openchain'; signature: string }

const isAbi = (value: unknown): value is AbiItem[] => Array.isArray(value) && value.length > 0

const FUNCTION_HASH = /^0x[a-f0-9]{8}$/
const EVENT_HASH = /^0x[a-f0-9]{64}$/

export const selectorEndpoint = defineEndpoint({
  params: z
    .object({
      kind: z.enum(['function', 'event']),
      // b32's path is case-sensitive and OpenChain echoes lowercase keys.
      hash: z.string().transform(hash => hash.toLowerCase()),
    })
    .refine(({ kind, hash }) => (kind === 'function' ? FUNCTION_HASH : EVENT_HASH).test(hash)),
  invalidParamsMessage: "kind must be 'function' or 'event', and hash length must match kind",

  cache: { ttl: DAY, stale: WEEK, browserMaxAge: 3600, size: 50_000 },
  notFound: {
    ttl: FIVE_MINUTES,
    stale: DAY,
    browserMaxAge: FIVE_MINUTES,
    size: 50_000,
    message: 'Selector not found in b32 or OpenChain',
  },

  fetch: async ({ kind, hash }): Promise<DecodedSelector> => {
    const [b32Result, openchainResult] = await Promise.allSettled([fetchB32(hash), fetchOpenchain(kind, hash)])

    if (b32Result.status === 'fulfilled' && isAbi(b32Result.value)) {
      const item = b32Result.value[0]
      if (item) return { source: 'b32', abi: item }
    }

    if (openchainResult.status === 'fulfilled' && openchainResult.value) {
      return { source: 'openchain', signature: openchainResult.value }
    }

    // Only a genuine miss if at least one source answered — otherwise surface the
    // outage rather than caching it as not-found.
    if (b32Result.status === 'rejected' && openchainResult.status === 'rejected') {
      throw b32Result.reason instanceof UpstreamError ? b32Result.reason : openchainResult.reason
    }
    throw new NotFoundError()
  },
})
