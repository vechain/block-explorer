import DataLoader from 'dataloader'
import { OPENCHAIN_URL } from '@/env.api'
import { UpstreamError } from '@/lib/upstream-error'

type Kind = 'function' | 'event'

const CHUNK = 50

interface OpenChainResponse {
  ok?: boolean
  result?: {
    function?: Record<string, Array<{ name: string; filtered?: boolean }> | null>
    event?: Record<string, Array<{ name: string; filtered?: boolean }> | null>
  }
}

const pickBest = (entries: Array<{ name: string; filtered?: boolean }> | null | undefined): string | null => {
  if (!entries?.length) return null
  const usable = entries.filter(e => !e.filtered)
  return (usable[0] ?? entries[0]).name
}

// One DataLoader per kind. Module-scoped so concurrent requests across the
// whole pod coalesce into a single batched upstream call within each tick.
// `cache: false` because the calling service owns the long-lived cache —
// the loader is purely a per-tick batch window.
const buildLoader = (kind: Kind) =>
  new DataLoader<string, string | null>(
    async hashes => {
      const out = new Map<string, string | null>(hashes.map(h => [h, null]))
      const chunks: string[][] = []
      for (let i = 0; i < hashes.length; i += CHUNK) chunks.push([...hashes.slice(i, i + CHUNK)])

      const results = await Promise.allSettled(
        chunks.map(async chunk => {
          const params = new URLSearchParams({ [kind]: chunk.join(','), filter: 'true' })
          const res = await fetch(`${OPENCHAIN_URL}?${params.toString()}`, {
            signal: AbortSignal.timeout(10_000),
          })
          if (!res.ok) throw new UpstreamError('openchain', res.status)
          const body = (await res.json()) as OpenChainResponse
          if (!body?.ok || !body.result) throw new UpstreamError('openchain', 502)
          const bucket = kind === 'function' ? body.result.function : body.result.event
          if (!bucket) return
          for (const h of chunk) out.set(h, pickBest(bucket[h]))
        }),
      )

      // Per-hash result: the value if its chunk resolved, else the rejection
      // reason so the calling service can distinguish miss from outage.
      const chunkFor = new Map<string, number>()
      chunks.forEach((chunk, i) => chunk.forEach(h => chunkFor.set(h, i)))

      return hashes.map(h => {
        const chunkIdx = chunkFor.get(h)
        const chunkResult = chunkIdx !== undefined ? results[chunkIdx] : undefined
        if (chunkResult?.status === 'rejected') return chunkResult.reason as Error
        return out.get(h) ?? null
      })
    },
    {
      cache: false,
      maxBatchSize: CHUNK,
      // ~5ms tick — long enough to coalesce a render burst, short enough
      // to still feel synchronous.
      batchScheduleFn: cb => setTimeout(cb, 5),
    },
  )

const functionLoader = buildLoader('function')
const eventLoader = buildLoader('event')

export async function fetchOpenchain(kind: Kind, hash: string): Promise<string | null> {
  const loader = kind === 'function' ? functionLoader : eventLoader
  return loader.load(hash)
}
