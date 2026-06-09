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

interface SourcifyFile {
  name: string
  path?: string
  content?: string
}

interface ContractMetadata {
  output?: { abi?: unknown }
  settings?: { compilationTarget?: Record<string, string> }
}

const extractAbi = (files: SourcifyFile[] | undefined): SourcifyHit | null => {
  if (!files) return null
  const metadataFile = files.find(f => f.name === 'metadata.json' || (f.path && f.path.endsWith('/metadata.json')))
  if (!metadataFile?.content) return null
  try {
    const meta = JSON.parse(metadataFile.content) as ContractMetadata
    if (!meta?.output?.abi || !Array.isArray(meta.output.abi)) return null
    const target = meta.settings?.compilationTarget
    const contractName = target ? Object.values(target)[0] : undefined
    return { abi: meta.output.abi as Abi, contractName }
  } catch {
    return null
  }
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
    const res = await fetch(`${SOURCIFY_URL}/files/any/${chainId}/${address.toLowerCase()}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 404) throw new NotFoundError()
    if (!res.ok) throw new UpstreamError('sourcify', res.status)

    const body = (await res.json()) as { files?: SourcifyFile[] }
    const extracted = extractAbi(body.files)
    if (!extracted) throw new NotFoundError()
    return extracted
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
