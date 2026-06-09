import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { OPENCHAIN_URL } from '@/env.api'
import { createErrorResponse } from '@/lib/api/index'

type Kind = 'function' | 'event'

interface OpenChainResponse {
  ok?: boolean
  result?: {
    function?: Record<string, Array<{ name: string; filtered?: boolean }> | null>
    event?: Record<string, Array<{ name: string; filtered?: boolean }> | null>
  }
}

// 1-day TTL when every hash resolved, 5-min when any came back null so
// newly-indexed selectors / topics surface quickly. Per-chunk 429s are
// evicted from Next's data cache below so they don't poison the store.
const ALL_HITS_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=3600'
const PARTIAL_OR_MISS_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400, max-age=300'

// OpenChain returns multiple matches per hash (selector collisions). Drop
// auto-generated `filtered` entries; take the first remaining hit — the API
// orders results roughly by popularity.
const pickBest = (entries: Array<{ name: string; filtered?: boolean }> | null | undefined): string | null => {
  if (!entries?.length) return null
  const usable = entries.filter(e => !e.filtered)
  const list = usable.length > 0 ? usable : entries
  return list[0].name
}

const isFunctionHash = (h: string) => /^0x[a-fA-F0-9]{8}$/.test(h)
const isEventHash = (h: string) => /^0x[a-fA-F0-9]{64}$/.test(h)

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get('kind')
  const hashesParam = searchParams.get('hashes')

  if (kindParam !== 'function' && kindParam !== 'event') {
    return createErrorResponse({ status: 400, message: "kind must be 'function' or 'event'" })
  }
  if (!hashesParam) {
    return createErrorResponse({ status: 400, message: 'hashes query parameter is required' })
  }

  const kind: Kind = kindParam
  const hashes = hashesParam
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(h => h.length > 0)

  const valid = kind === 'function' ? isFunctionHash : isEventHash
  const filtered = hashes.filter(valid)
  if (filtered.length === 0) {
    return createErrorResponse({ status: 400, message: 'No valid hashes provided' })
  }

  try {
    // Chunk at 50 hashes per upstream request to keep URLs sane.
    const CHUNK = 50
    const chunks: string[][] = []
    for (let i = 0; i < filtered.length; i += CHUNK) {
      chunks.push(filtered.slice(i, i + CHUNK))
    }

    const out: Record<string, string | null> = Object.fromEntries(filtered.map(h => [h, null]))

    await Promise.all(
      chunks.map(async chunk => {
        const params = new URLSearchParams()
        params.set(kind, chunk.join(','))
        params.set('filter', 'true')
        const url = `${OPENCHAIN_URL}?${params.toString()}`
        // Same chunk URL → same Next data cache entry. Different callers
        // querying overlapping hash sets get partial cache reuse via the
        // chunk granularity; identical query strings hit the cache. The
        // per-chunk tag lets us evict just this chunk on 429.
        const entryTag = `openchain:${url}`
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
          next: { revalidate: 86_400, tags: ['openchain', entryTag] },
        })
        if (response.status === 429) {
          // Don't let this chunk's 429 sit in Next's data cache for a day.
          revalidateTag(entryTag)
          return
        }
        if (!response.ok) return
        const body = (await response.json()) as OpenChainResponse
        if (!body?.ok || !body.result) return
        const bucket = kind === 'function' ? body.result.function : body.result.event
        if (!bucket) return
        for (const hash of chunk) {
          const sig = pickBest(bucket[hash])
          if (sig) out[hash] = sig
        }
      }),
    )

    // Cache aggressively only when every hash resolved — otherwise keep the
    // window short so newly indexed entries surface quickly.
    const allHit = filtered.every(h => out[h] !== null)
    return withCacheControl(NextResponse.json(out), allHit ? ALL_HITS_CACHE_CONTROL : PARTIAL_OR_MISS_CACHE_CONTROL)
  } catch (error) {
    console.error('Unexpected error in openchain route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      kind,
      count: filtered.length,
    })
    return withCacheControl(createErrorResponse({ status: 500, message: 'An unexpected error occurred' }), 'no-store')
  }
}
