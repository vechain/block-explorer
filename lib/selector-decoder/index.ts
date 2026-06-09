import { createCache } from 'async-cache-dedupe'
import { LRUCache } from 'lru-cache'
import type { AbiItem } from 'viem'
import { NotFoundError, UpstreamError } from '@/lib/upstream-error'
import { fetchB32 } from './sources/b32'
import { fetchOpenchain, type Kind } from './sources/openchain'

const DAY = 86_400
const WEEK = 604_800
const FIVE_MIN_MS = 5 * 60 * 1000

export type { Kind }

// b32 returns a fully-formed ABI fragment with indexed annotations intact.
// OpenChain returns a bare canonical signature — the client decides how to
// interpret it (function vs. event, and for events which params are
// indexed) since the right answer depends on the caller's topic count.
export type DecodedSelector =
  | { source: 'b32'; abi: AbiItem }
  | { source: 'openchain'; signature: string }

export type Lookup<T> = { kind: 'ok'; data: T } | { kind: 'not-found' }

const hits = createCache({ storage: { type: 'memory', options: { size: 50_000 } } })
const miss = new LRUCache<string, true>({ max: 50_000, ttl: FIVE_MIN_MS })

interface SelectorKey {
  kind: Kind
  hash: string
}

const isAbi = (value: unknown): value is AbiItem[] => Array.isArray(value) && value.length > 0

hits.define(
  'selector',
  {
    ttl: DAY,
    stale: WEEK,
    serialize: ({ kind, hash }: SelectorKey) => `${kind}:${hash.toLowerCase()}`,
  },
  async ({ kind, hash }: SelectorKey): Promise<DecodedSelector> => {
    // Fire both sources in parallel. Prefer b32 (full ABI fragment with
    // parameter names) over OpenChain (signature string we have to parse).
    const [b32Result, openchainResult] = await Promise.allSettled([fetchB32(hash), fetchOpenchain(kind, hash)])

    if (b32Result.status === 'fulfilled' && isAbi(b32Result.value)) {
      const item = b32Result.value[0]
      if (item) return { source: 'b32', abi: item }
    }

    if (openchainResult.status === 'fulfilled' && openchainResult.value) {
      return { source: 'openchain', signature: openchainResult.value }
    }

    // Both sources came back empty. If BOTH actually errored (vs. returned
    // null), surface the error so the route returns 502 and we don't write
    // a miss entry that hides an outage.
    if (b32Result.status === 'rejected' && openchainResult.status === 'rejected') {
      throw b32Result.reason instanceof UpstreamError ? b32Result.reason : openchainResult.reason
    }
    throw new NotFoundError()
  },
)

interface DefinedCache {
  selector(key: SelectorKey): Promise<DecodedSelector>
}

export async function decodeSelector(kind: Kind, hash: string): Promise<Lookup<DecodedSelector>> {
  const key = `${kind}:${hash.toLowerCase()}`
  if (miss.has(key)) return { kind: 'not-found' }
  try {
    const data = await (hits as unknown as DefinedCache).selector({ kind, hash })
    return { kind: 'ok', data }
  } catch (err) {
    if (err instanceof NotFoundError) {
      miss.set(key, true)
      return { kind: 'not-found' }
    }
    throw err
  }
}
