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
        const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
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

    return NextResponse.json(out)
  } catch (error) {
    console.error('Unexpected error in openchain route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      kind,
      count: filtered.length,
    })
    return createErrorResponse({ status: 500, message: 'An unexpected error occurred' })
  }
}
