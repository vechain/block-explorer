import { createCache } from 'async-cache-dedupe'
import { LRUCache } from 'lru-cache'
import type { Abi } from 'viem'
import { SOURCIFY_URL } from '@/env.api'
import { NotFoundError, UpstreamError } from './upstream-error'

const DAY = 86_400
const WEEK = 604_800
const FIVE_MIN_MS = 5 * 60 * 1000

export interface SourcifyHit {
  abi: Abi
  contractName?: string
}

export type Lookup<T> = { kind: 'ok'; data: T } | { kind: 'not-found' }

// Sourcify v2 returns the ABI as a top-level field when requested via
// `?fields=abi,compilation` — no metadata.json parsing required. v1
// (the `/files/any/...` endpoint) is being deprecated via scheduled
// brownouts that return 503 across multi-hour windows, so we use v2
// directly.
interface SourcifyV2Response {
  abi?: Abi
  compilation?: {
    name?: string
    fullyQualifiedName?: string
  }
  match?: string | null
}

// Hits: long TTL + SWR + in-flight dedup. Rejections aren't stored, but
// concurrent waiters share the in-flight promise — so a cold 429 storm
// still fires upstream exactly once.
const hits = createCache({ storage: { type: 'memory', options: { size: 10_000 } } })

// Misses: short TTL so a freshly-verified contract surfaces within minutes
// without being shadowed by the long success TTL.
const miss = new LRUCache<string, true>({ max: 10_000, ttl: FIVE_MIN_MS })

interface SourcifyKey {
  chainId: string
  address: string
}

hits.define(
  'sourcify',
  {
    ttl: DAY,
    stale: WEEK,
    serialize: ({ chainId, address }: SourcifyKey) => `${chainId}:${address.toLowerCase()}`,
  },
  async ({ chainId, address }: SourcifyKey): Promise<SourcifyHit> => {
    const res = await fetch(
      `${SOURCIFY_URL}/v2/contract/${chainId}/${address.toLowerCase()}?fields=abi,compilation`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (res.status === 404) throw new NotFoundError()
    if (!res.ok) throw new UpstreamError('sourcify', res.status)

    const body = (await res.json()) as SourcifyV2Response
    if (!body.abi || !Array.isArray(body.abi) || body.abi.length === 0) {
      throw new NotFoundError()
    }
    return { abi: body.abi, contractName: body.compilation?.name }
  },
)

interface DefinedCache {
  sourcify(key: SourcifyKey): Promise<SourcifyHit>
}

export async function fetchSourcify(args: SourcifyKey): Promise<Lookup<SourcifyHit>> {
  const key = `${args.chainId}:${args.address.toLowerCase()}`
  if (miss.has(key)) return { kind: 'not-found' }
  try {
    const data = await (hits as unknown as DefinedCache).sourcify(args)
    return { kind: 'ok', data }
  } catch (err) {
    if (err instanceof NotFoundError) {
      miss.set(key, true)
      return { kind: 'not-found' }
    }
    throw err
  }
}
