import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import type { Abi } from 'viem'
import { B32_URL } from '@/env.api'
import { createErrorResponse } from '@/lib/api/index'

// b32 is community-curated and entries can be added / corrected over time —
// a 1-hour success TTL lets corrections propagate quickly while still
// absorbing the bulk of repeat lookups. 5 min on 404 so newly-added
// signatures surface fast; 429s are evicted from Next's data cache and
// returned with `no-store`.
const SUCCESS_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400, max-age=600'
const NOT_FOUND_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400, max-age=300'

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signature = searchParams.get('signature')

  if (!signature || signature.trim().length === 0) {
    return createErrorResponse({ status: 400, message: 'Signature parameter is required' })
  }

  try {
    // Direct fetch (instead of apiClient.get) so we can attach
    // `next: { revalidate, tags }` and have the upstream response served
    // from Next's data cache on repeats within the TTL. The per-entry tag
    // lets us evict just this signature on 429.
    const entryTag = `b32:${signature}`
    const response = await fetch(`${B32_URL}/q/${signature}.json`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3_600, tags: ['b32', entryTag] },
    })

    if (response.status === 429) {
      revalidateTag(entryTag)
      return withCacheControl(createErrorResponse({ status: 502, message: 'b32 rate-limited' }), 'no-store')
    }
    if (response.status === 404) {
      return withCacheControl(
        createErrorResponse({ status: 404, message: 'Signature not in b32' }),
        NOT_FOUND_CACHE_CONTROL,
      )
    }
    if (!response.ok) {
      return withCacheControl(
        createErrorResponse({ status: 502, message: `b32 responded ${response.status}` }),
        'no-store',
      )
    }

    const data = (await response.json()) as Abi
    return withCacheControl(NextResponse.json(data), SUCCESS_CACHE_CONTROL)
  } catch (error) {
    console.error('Unexpected error in b32 route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature,
    })
    return withCacheControl(createErrorResponse({ status: 500, message: 'An unexpected error occurred' }), 'no-store')
  }
}
