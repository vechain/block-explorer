import { type NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/api/index'
import { fetchSourcify, type SourcifyHit } from '@/lib/sourcify-cache'
import { UpstreamError } from '@/lib/upstream-error'

export type SourcifyAbiResponse = SourcifyHit

// 1-day TTL on success, 5-min on 404. Hits the in-memory hit / miss caches
// inside fetchSourcify — concurrent callers for the same (chainId, address)
// share one upstream call.
const HIT_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=3600'
const MISS_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400, max-age=300'

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chainId = searchParams.get('chainId')
  const address = searchParams.get('address')

  if (!chainId || !/^\d+$/.test(chainId)) {
    return createErrorResponse({ status: 400, message: 'chainId query parameter must be a numeric string' })
  }
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return createErrorResponse({ status: 400, message: 'address query parameter must be a hex address' })
  }

  try {
    const result = await fetchSourcify({ chainId, address })
    if (result.kind === 'not-found') {
      return withCacheControl(
        createErrorResponse({ status: 404, message: 'Contract not verified on Sourcify' }),
        MISS_CACHE_CONTROL,
      )
    }
    return withCacheControl(NextResponse.json(result.data), HIT_CACHE_CONTROL)
  } catch (err) {
    if (err instanceof UpstreamError) {
      return withCacheControl(createErrorResponse({ status: 502, message: err.message }), 'no-store')
    }
    console.error('Unexpected error in sourcify route:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      chainId,
      address,
    })
    return withCacheControl(createErrorResponse({ status: 500, message: 'An unexpected error occurred' }), 'no-store')
  }
}
