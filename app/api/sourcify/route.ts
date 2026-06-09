import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import type { Abi } from 'viem'
import { SOURCIFY_URL } from '@/env.api'
import { createErrorResponse } from '@/lib/api/index'

interface SourcifyFile {
  name: string
  path?: string
  content?: string
}

interface SourcifyResponse {
  status?: string
  files?: SourcifyFile[]
}

interface ContractMetadata {
  output?: {
    abi?: unknown
  }
  settings?: {
    compilationTarget?: Record<string, string>
  }
}

export interface SourcifyAbiResponse {
  abi: Abi
  contractName?: string
}

// 1-day TTL on success, 5-min on 404 so freshly-verified contracts surface
// quickly. 429s are evicted from Next's data cache (see below) and returned
// with `no-store` so they never sit in any cache layer.
const SUCCESS_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=3600'
const NOT_FOUND_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400, max-age=300'

const extractAbi = (files: SourcifyFile[]): SourcifyAbiResponse | null => {
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
    // `next: { revalidate, tags }` puts the upstream response in Next's data
    // cache (.next/cache/fetch-cache under output: 'standalone'). Repeat
    // requests for the same (chainId, address) inside the TTL are served
    // without touching Sourcify. The per-entry tag lets us evict just this
    // address on 429 below; the route-wide tag is left in for future
    // maintenance purges via `revalidateTag('sourcify')`.
    const entryTag = `sourcify:${chainId}:${address.toLowerCase()}`
    const response = await fetch(`${SOURCIFY_URL}/files/any/${chainId}/${address.toLowerCase()}`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 86_400, tags: ['sourcify', entryTag] },
    })

    if (response.status === 429) {
      // Evict the just-cached 429 so the next request retries upstream
      // rather than serving a stale rate-limit for 24h.
      revalidateTag(entryTag)
      return withCacheControl(createErrorResponse({ status: 502, message: 'Sourcify rate-limited' }), 'no-store')
    }
    if (response.status === 404) {
      return withCacheControl(
        createErrorResponse({ status: 404, message: 'Contract not verified on Sourcify' }),
        NOT_FOUND_CACHE_CONTROL,
      )
    }
    if (!response.ok) {
      // Don't poison the cache with an upstream blip.
      return withCacheControl(
        createErrorResponse({ status: 502, message: `Sourcify responded ${response.status}` }),
        'no-store',
      )
    }

    const data = (await response.json()) as SourcifyResponse
    if (!data?.files) {
      return withCacheControl(
        createErrorResponse({ status: 502, message: 'Sourcify response missing files array' }),
        'no-store',
      )
    }

    const extracted = extractAbi(data.files)
    if (!extracted) {
      return withCacheControl(
        createErrorResponse({ status: 404, message: 'No ABI found in Sourcify metadata' }),
        NOT_FOUND_CACHE_CONTROL,
      )
    }

    return withCacheControl(NextResponse.json(extracted), SUCCESS_CACHE_CONTROL)
  } catch (error) {
    console.error('Unexpected error in sourcify route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      chainId,
      address,
    })
    return withCacheControl(createErrorResponse({ status: 500, message: 'An unexpected error occurred' }), 'no-store')
  }
}
