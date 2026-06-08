import { type NextRequest, NextResponse } from 'next/server'
import type { Abi } from 'viem'
import { B32_URL } from '@/env.api'
import { createErrorResponse } from '@/lib/api/index'

// b32 is community-curated and entries can be added / corrected over time —
// 1 day balances staleness against rate-limit pressure on the upstream.
const SUCCESS_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=3600'
const NOT_FOUND_CACHE_CONTROL = 'public, s-maxage=1800, stale-while-revalidate=86400, max-age=300'

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
    // from Next's data cache on repeats within the TTL.
    const response = await fetch(`${B32_URL}/q/${signature}.json`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86_400, tags: ['b32'] },
    })

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
