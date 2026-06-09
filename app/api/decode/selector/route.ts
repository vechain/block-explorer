import { type NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/api/index'
import { decodeSelector } from '@/lib/selector-decoder'
import { UpstreamError } from '@/lib/upstream-error'

const HIT_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=3600'
const MISS_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400, max-age=300'

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

const isFunctionHash = (h: string) => /^0x[a-fA-F0-9]{8}$/.test(h)
const isEventHash = (h: string) => /^0x[a-fA-F0-9]{64}$/.test(h)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get('kind')
  const hash = searchParams.get('hash')

  if (kindParam !== 'function' && kindParam !== 'event') {
    return createErrorResponse({ status: 400, message: "kind must be 'function' or 'event'" })
  }
  if (!hash || !(kindParam === 'function' ? isFunctionHash(hash) : isEventHash(hash))) {
    return createErrorResponse({ status: 400, message: 'hash format does not match kind' })
  }

  try {
    const result = await decodeSelector(kindParam, hash)
    if (result.kind === 'not-found') {
      return withCacheControl(
        createErrorResponse({ status: 404, message: 'Selector not found in b32 or OpenChain' }),
        MISS_CACHE_CONTROL,
      )
    }
    return withCacheControl(NextResponse.json(result.data), HIT_CACHE_CONTROL)
  } catch (err) {
    if (err instanceof UpstreamError) {
      return withCacheControl(createErrorResponse({ status: 502, message: err.message }), 'no-store')
    }
    console.error('Unexpected error in decode/selector route:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      kind: kindParam,
      hash,
    })
    return withCacheControl(createErrorResponse({ status: 500, message: 'An unexpected error occurred' }), 'no-store')
  }
}
