import { createCache } from 'async-cache-dedupe'
import { LRUCache } from 'lru-cache'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createErrorResponse } from '@/lib/api/index'
import { NotFoundError, UpstreamError } from '@/lib/upstream-error'

/** Builds a route handler that proxies an upstream API through a TTL cache. */

export interface CacheProfile {
  ttl: number
  stale: number
  browserMaxAge?: number
  size: number
}

interface NotFoundProfile extends CacheProfile {
  message: string
}

interface EndpointDefinition<TSchema extends z.ZodObject<z.ZodRawShape>> {
  params: TSchema
  /** Throw `NotFoundError` for a definitive miss, `UpstreamError` for a failure. */
  fetch: (params: z.infer<TSchema>) => Promise<unknown>
  cache: CacheProfile
  /** Omit to leave negative lookups uncached; a `NotFoundError` still yields a 404. */
  notFound?: NotFoundProfile
  invalidParamsMessage?: string
}

interface RegisteredEndpoint {
  parse: (searchParams: URLSearchParams) => { ok: true; params: Record<string, unknown> } | { ok: false }
  fetch: (params: Record<string, unknown>) => Promise<unknown>
  cache: CacheProfile
  notFound?: NotFoundProfile
  invalidParamsMessage?: string
}

// Undeclared params are rejected rather than dropped: keys are built from validated
// values, so a param we ignore would be served a response keyed without it.
const parseDeclared = (schema: z.ZodObject<z.ZodRawShape>, searchParams: URLSearchParams) => {
  const declared = new Set(Object.keys(schema.shape))
  const candidate: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (!declared.has(key)) return { ok: false } as const
    candidate[key] = value
  }

  const result = schema.safeParse(candidate)
  return result.success ? ({ ok: true, params: result.data } as const) : ({ ok: false } as const)
}

export const defineEndpoint = <TSchema extends z.ZodObject<z.ZodRawShape>>(
  config: EndpointDefinition<TSchema>,
): RegisteredEndpoint => ({
  parse: searchParams => parseDeclared(config.params, searchParams),
  // Sound: the value was produced by `config.params` in `parse` above.
  fetch: params => config.fetch(params as z.infer<TSchema>),
  cache: config.cache,
  notFound: config.notFound,
  invalidParamsMessage: config.invalidParamsMessage,
})

const NO_CACHE_CONTROL = 'no-store'

const cacheControl = ({ ttl, stale, browserMaxAge = 0 }: CacheProfile) =>
  `public, max-age=${browserMaxAge}, s-maxage=${ttl}, stale-while-revalidate=${stale}`

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

const serializeParams = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams()
  for (const key of Object.keys(params).sort()) {
    const value = params[key]
    if (value !== undefined) searchParams.set(key, String(value))
  }
  return searchParams.toString()
}

type CacheMethod = (params: Record<string, unknown>) => Promise<unknown>

export const createCachedProxy = ({
  name,
  endpoints,
}: {
  name: string
  /** Keyed by path below the route. Use `''` for a route with no dynamic segments. */
  endpoints: Record<string, RegisteredEndpoint>
}) => {
  const hits = new Map<string, CacheMethod>()
  const misses = new Map<string, LRUCache<string, true>>()

  for (const [path, endpoint] of Object.entries(endpoints)) {
    const defineName = `${name}_${path}`.replace(/\W/g, '_')
    const cache = createCache({ storage: { type: 'memory', options: { size: endpoint.cache.size } } })

    cache.define(
      defineName,
      {
        ttl: endpoint.cache.ttl,
        stale: endpoint.cache.stale,
        serialize: (params: Record<string, unknown>) => serializeParams(params),
      },
      endpoint.fetch,
    )

    hits.set(path, (cache as unknown as Record<string, CacheMethod>)[defineName])

    if (endpoint.notFound) {
      misses.set(path, new LRUCache<string, true>({ max: endpoint.notFound.size, ttl: endpoint.notFound.ttl * 1_000 }))
    }
  }

  const handle = async (request: NextRequest, pathParams?: Promise<{ path: string[] }>): Promise<NextResponse> => {
    const path = pathParams ? (await pathParams).path.join('/') : ''

    // The registry is the allowlist — an unlisted path is never forwarded.
    if (!Object.hasOwn(endpoints, path)) {
      return createErrorResponse({ status: 404, message: `Unknown ${name} endpoint` })
    }

    const endpoint = endpoints[path]
    const { searchParams } = new URL(request.url)
    const parsed = endpoint.parse(searchParams)

    if (!parsed.ok) {
      return createErrorResponse({
        status: 400,
        message: endpoint.invalidParamsMessage ?? `Invalid parameters for ${name}${path ? `/${path}` : ''}`,
      })
    }

    const { notFound } = endpoint
    const missCache = misses.get(path)
    const missKey = serializeParams(parsed.params)

    const respondNotFound = () =>
      withCacheControl(
        createErrorResponse({ status: 404, message: notFound?.message ?? 'Not found' }),
        notFound ? cacheControl(notFound) : NO_CACHE_CONTROL,
      )

    if (missCache?.has(missKey)) return respondNotFound()

    try {
      const data = await hits.get(path)?.(parsed.params)
      return withCacheControl(NextResponse.json(data), cacheControl(endpoint.cache))
    } catch (error) {
      if (error instanceof NotFoundError) {
        missCache?.set(missKey, true)
        return respondNotFound()
      }

      // Never cached — a cached outage outlives the outage.
      if (error instanceof UpstreamError) {
        const status = error.status === 504 ? 504 : 502
        return withCacheControl(createErrorResponse({ status, message: error.message }), NO_CACHE_CONTROL)
      }

      console.error(`Unexpected error in ${name} proxy route:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: path,
      })

      return withCacheControl(
        createErrorResponse({ status: 500, message: 'An unexpected error occurred' }),
        NO_CACHE_CONTROL,
      )
    }
  }

  return { handle }
}
