import { createCache } from 'async-cache-dedupe'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createErrorResponse } from '@/lib/api/index'
import { cacheStorage, createMissCache, type MissCache, namespacedCacheName } from '@/lib/cache-store'
import { metrics } from '@/lib/metrics'
import { NotFoundError, UpstreamError } from '@/lib/upstream-error'

/** Builds a route handler that proxies an upstream API through a TTL cache. */

export interface CacheProfile {
  /** A function when the response itself decides how long it may be reused. */
  ttl: number | ((result: unknown) => number)
  stale: number
  /** Capped at the resolved ttl — a browser must not outlive the server's own entry. */
  browserMaxAge?: number
  size: number
}

interface NotFoundProfile extends Omit<CacheProfile, 'ttl'> {
  ttl: number
  message: string
}

interface EndpointDefinition<TSchema extends z.ZodObject<z.ZodRawShape>> {
  params: TSchema
  /** Params the upstream takes as repeated keys (`?k=a&k=b`). Declare the schema as an array. */
  arrayParams?: readonly (keyof TSchema['shape'] & string)[]
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
// values, so a param we ignore would be served a response keyed without it. A repeated
// scalar is rejected for the same reason — only one of its values could reach the key.
const parseDeclared = (
  schema: z.ZodObject<z.ZodRawShape>,
  arrayParams: ReadonlySet<string>,
  searchParams: URLSearchParams,
) => {
  const declared = new Set(Object.keys(schema.shape))
  const candidate: Record<string, string | string[]> = {}

  for (const key of new Set(searchParams.keys())) {
    if (!declared.has(key)) return { ok: false } as const

    const values = searchParams.getAll(key)
    if (arrayParams.has(key)) {
      candidate[key] = values
    } else {
      if (values.length > 1) return { ok: false } as const
      candidate[key] = values[0]
    }
  }

  const result = schema.safeParse(candidate)
  return result.success ? ({ ok: true, params: result.data } as const) : ({ ok: false } as const)
}

export const defineEndpoint = <TSchema extends z.ZodObject<z.ZodRawShape>>(
  config: EndpointDefinition<TSchema>,
): RegisteredEndpoint => ({
  parse: searchParams => parseDeclared(config.params, new Set(config.arrayParams ?? []), searchParams),
  // Sound: the value was produced by `config.params` in `parse` above.
  fetch: params => config.fetch(params as z.infer<TSchema>),
  cache: config.cache,
  notFound: config.notFound,
  invalidParamsMessage: config.invalidParamsMessage,
})

const NO_CACHE_CONTROL = 'no-store'

const cacheControl = ({ ttl, stale, browserMaxAge = 0 }: { ttl: number; stale: number; browserMaxAge?: number }) =>
  `public, max-age=${Math.min(browserMaxAge, ttl)}, s-maxage=${ttl}, stale-while-revalidate=${stale}`

const withCacheControl = (response: NextResponse, value: string): NextResponse => {
  response.headers.set('Cache-Control', value)
  return response
}

// Array values are sorted so that the same set in a different order shares one entry
// rather than forking the cache, and never collapsed into a single comma-joined value.
const serializeParams = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams()
  for (const key of Object.keys(params).sort()) {
    const value = params[key]
    if (value === undefined) continue

    if (Array.isArray(value)) {
      for (const item of value.map(String).sort()) searchParams.append(key, item)
    } else {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

type CacheMethod = (params: Record<string, unknown>) => Promise<unknown>

type EndpointLabels = { name: string; path: string }

const upstreamOutcome = (error: unknown) => {
  if (error instanceof NotFoundError) return 'not_found'
  if (error instanceof UpstreamError) return 'upstream_error'
  return 'error'
}

// An upstream 4xx is the upstream answering, not a fault of ours; a timeout stays a 504.
const proxiedStatus = (status: number) => (status === 504 || (status >= 400 && status < 500) ? status : 502)

const withUpstreamMetrics =
  (labels: EndpointLabels, fetch: CacheMethod): CacheMethod =>
  async params => {
    const stopTimer = metrics.upstreamDuration.startTimer(labels)
    try {
      const result = await fetch(params)
      stopTimer()
      metrics.upstreamRequests.inc({ ...labels, outcome: 'ok' })
      return result
    } catch (error) {
      stopTimer()
      metrics.upstreamRequests.inc({ ...labels, outcome: upstreamOutcome(error) })
      throw error
    }
  }

export const createCachedProxy = ({
  name,
  endpoints,
}: {
  name: string
  /** Keyed by path below the route. Use `''` for a route with no dynamic segments. */
  endpoints: Record<string, RegisteredEndpoint>
}) => {
  const hits = new Map<string, CacheMethod>()
  const misses = new Map<string, MissCache>()

  for (const [path, endpoint] of Object.entries(endpoints)) {
    const defineName = `${name}_${path}`.replace(/\W/g, '_')
    // Namespaced rather than bare: the store may be shared with another build.
    const storageName = namespacedCacheName(defineName)
    const labels: EndpointLabels = { name, path }
    const cache = createCache({ storage: cacheStorage(endpoint.cache.size) })

    cache.define(
      storageName,
      {
        ttl: endpoint.cache.ttl,
        stale: endpoint.cache.stale,
        serialize: (params: Record<string, unknown>) => serializeParams(params),
        // A stale serve fires `onHit` like any other; the library exposes no separate event.
        onHit: () => metrics.cacheRequests.inc({ ...labels, result: 'hit' }),
        onMiss: () => metrics.cacheRequests.inc({ ...labels, result: 'miss' }),
        onDedupe: () => metrics.cacheRequests.inc({ ...labels, result: 'dedupe' }),
      },
      withUpstreamMetrics(labels, endpoint.fetch),
    )

    hits.set(path, (cache as unknown as Record<string, CacheMethod>)[storageName])

    if (endpoint.notFound) {
      misses.set(path, createMissCache({ name: defineName, ttl: endpoint.notFound.ttl, size: endpoint.notFound.size }))
    }
  }

  // Labelled by the matched template, so a prober hitting unlisted paths adds no series.
  const routeTemplate = (path: string) =>
    Object.hasOwn(endpoints, path) ? `/api/${name}${path ? `/${path}` : ''}` : `/api/${name}/*`

  const respond = async (request: NextRequest, path: string): Promise<NextResponse> => {
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

    if (await missCache?.has(missKey)) return respondNotFound()

    try {
      const data = await hits.get(path)?.(parsed.params)
      const { ttl } = endpoint.cache
      return withCacheControl(
        NextResponse.json(data),
        cacheControl({ ...endpoint.cache, ttl: typeof ttl === 'function' ? ttl(data) : ttl }),
      )
    } catch (error) {
      if (error instanceof NotFoundError) {
        await missCache?.add(missKey)
        return respondNotFound()
      }

      // Never cached — a cached outage outlives the outage.
      if (error instanceof UpstreamError) {
        return withCacheControl(
          createErrorResponse({ status: proxiedStatus(error.status), message: error.message }),
          NO_CACHE_CONTROL,
        )
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

  const handle = async (request: NextRequest, pathParams?: Promise<{ path: string[] }>): Promise<NextResponse> => {
    const path = pathParams ? (await pathParams).path.join('/') : ''
    const response = await respond(request, path)

    metrics.httpResponses.inc({ route: routeTemplate(path), status: String(response.status) })

    return response
  }

  return { handle }
}
