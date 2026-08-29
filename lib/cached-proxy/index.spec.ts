import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createCachedProxy, defineEndpoint } from './index'
import { metrics } from '@/lib/metrics'
import { NotFoundError, UpstreamError } from '@/lib/upstream-error'

const CACHE = { ttl: 60, stale: 300, size: 10 }
const NOT_FOUND = { ttl: 30, stale: 120, browserMaxAge: 30, size: 10, message: 'Nothing here' }

const buildProxy = (fetchImpl: (params: { id: string }) => Promise<unknown>, options?: { negativeCache?: boolean }) =>
  createCachedProxy({
    name: 'test',
    endpoints: {
      '': defineEndpoint({
        params: z.object({ id: z.string().regex(/^[a-z0-9]+$/) }),
        cache: CACHE,
        ...(options?.negativeCache === false ? {} : { notFound: NOT_FOUND }),
        fetch: fetchImpl,
      }),
    },
  })

const send = (proxy: ReturnType<typeof buildProxy>, query = 'id=abc') =>
  proxy.handle(new NextRequest(new URL(`http://localhost/api/test?${query}`)))

describe('createCachedProxy', () => {
  it('caches a successful response and reuses it within the TTL', async () => {
    const upstream = vi.fn().mockResolvedValue({ ok: true })
    const proxy = buildProxy(upstream)

    const first = await send(proxy)
    await send(proxy)

    expect(upstream).toHaveBeenCalledTimes(1)
    expect(first.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=300')
  })

  it('caches a not-found separately, on its own shorter TTL', async () => {
    const upstream = vi.fn().mockRejectedValue(new NotFoundError())
    const proxy = buildProxy(upstream)

    const first = await send(proxy)
    const second = await send(proxy)

    expect(first.status).toBe(404)
    await expect(first.json()).resolves.toMatchObject({ message: 'Nothing here' })
    expect(first.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30, stale-while-revalidate=120')

    expect(second.status).toBe(404)
    expect(upstream).toHaveBeenCalledTimes(1)
  })

  it('still 404s without caching when an endpoint declares no negative cache', async () => {
    const upstream = vi.fn().mockRejectedValue(new NotFoundError())
    const proxy = buildProxy(upstream, { negativeCache: false })

    const first = await send(proxy)
    await send(proxy)

    expect(first.status).toBe(404)
    expect(first.headers.get('Cache-Control')).toBe('no-store')
    expect(upstream).toHaveBeenCalledTimes(2)
  })

  it('never caches an upstream failure — a cached outage outlives the outage', async () => {
    const upstream = vi.fn().mockRejectedValue(new UpstreamError('test-upstream', 503))
    const proxy = buildProxy(upstream)

    const first = await send(proxy)
    await send(proxy)

    expect(first.status).toBe(502)
    expect(first.headers.get('Cache-Control')).toBe('no-store')
    expect(upstream).toHaveBeenCalledTimes(2)
  })

  // Rewriting these to 502 counted the upstream's own answer as a server error of ours.
  it('passes an upstream 4xx through instead of rewriting it to a server error', async () => {
    for (const status of [400, 403, 404, 429]) {
      const proxy = buildProxy(vi.fn().mockRejectedValue(new UpstreamError('test-upstream', status)))

      expect((await send(proxy)).status).toBe(status)
    }
  })

  it('keeps a timeout a 504 and any other upstream status a 502', async () => {
    const timedOut = buildProxy(vi.fn().mockRejectedValue(new UpstreamError('test-upstream', 504)))
    const unavailable = buildProxy(vi.fn().mockRejectedValue(new UpstreamError('test-upstream', 500)))

    expect((await send(timedOut)).status).toBe(504)
    expect((await send(unavailable)).status).toBe(502)
  })

  it('maps an unexpected error to 500 without caching', async () => {
    const upstream = vi.fn().mockRejectedValue(new Error('boom'))
    const proxy = buildProxy(upstream)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await send(proxy)

    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    consoleError.mockRestore()
  })

  it('rejects an undeclared query parameter rather than keying without it', async () => {
    const upstream = vi.fn().mockResolvedValue({ ok: true })
    const proxy = buildProxy(upstream)

    const response = await send(proxy, 'id=abc&sneaky=1')

    expect(response.status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects params that fail the schema', async () => {
    const upstream = vi.fn().mockResolvedValue({ ok: true })
    const proxy = buildProxy(upstream)

    const response = await send(proxy, 'id=NOT-VALID')

    expect(response.status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('routes by path and 404s anything absent from the registry', async () => {
    const alpha = vi.fn().mockResolvedValue({ from: 'alpha' })
    const beta = vi.fn().mockResolvedValue({ from: 'beta' })
    const proxy = createCachedProxy({
      name: 'multi',
      endpoints: {
        alpha: defineEndpoint({ params: z.object({}), cache: CACHE, fetch: alpha }),
        'nested/beta': defineEndpoint({ params: z.object({}), cache: CACHE, fetch: beta }),
      },
    })

    const request = new NextRequest(new URL('http://localhost/api/multi/alpha'))
    await expect(
      proxy.handle(request, Promise.resolve({ path: ['alpha'] })).then(response => response.json()),
    ).resolves.toEqual({ from: 'alpha' })
    await expect(
      proxy.handle(request, Promise.resolve({ path: ['nested', 'beta'] })).then(response => response.json()),
    ).resolves.toEqual({ from: 'beta' })

    const unknown = await proxy.handle(request, Promise.resolve({ path: ['gamma'] }))
    expect(unknown.status).toBe(404)
  })

  it('keys distinct params separately', async () => {
    const upstream = vi.fn().mockResolvedValue({ ok: true })
    const proxy = buildProxy(upstream)

    await send(proxy, 'id=abc')
    await send(proxy, 'id=def')

    expect(upstream).toHaveBeenCalledTimes(2)
  })

  it('rejects a repeated scalar rather than keying by one of its values', async () => {
    const upstream = vi.fn().mockResolvedValue({ ok: true })
    const proxy = buildProxy(upstream)

    const response = await send(proxy, 'id=abc&id=def')

    expect(response.status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  describe('response-derived ttl', () => {
    const buildTtlProxy = (fetchImpl: (params: { id: string }) => Promise<unknown>) =>
      createCachedProxy({
        name: 'test',
        endpoints: {
          '': defineEndpoint({
            params: z.object({ id: z.string() }),
            cache: {
              ttl: result => ((result as { settled: boolean }).settled ? 600 : 10),
              stale: 10,
              browserMaxAge: 600,
              size: 10,
            },
            fetch: fetchImpl,
          }),
        },
      })

    it('lets the response choose its own lifetime', async () => {
      const proxy = buildTtlProxy(async ({ id }) => ({ settled: id === 'settled' }))

      const settled = await send(proxy, 'id=settled')
      const unsettled = await send(proxy, 'id=unsettled')

      expect(settled.headers.get('Cache-Control')).toBe('public, max-age=600, s-maxage=600, stale-while-revalidate=10')
      expect(unsettled.headers.get('Cache-Control')).toBe('public, max-age=10, s-maxage=10, stale-while-revalidate=10')
    })

    it('never lets a browser hold a response longer than the server entry', async () => {
      const proxy = buildTtlProxy(async () => ({ settled: false }))

      const response = await send(proxy, 'id=unsettled')

      expect(response.headers.get('Cache-Control')).toContain('max-age=10,')
    })
  })

  describe('array params', () => {
    const buildArrayProxy = (fetchImpl: (params: { tag?: string[] }) => Promise<unknown>) =>
      createCachedProxy({
        name: 'test',
        endpoints: {
          '': defineEndpoint({
            params: z.object({ tag: z.array(z.enum(['a', 'b', 'c'])).optional() }),
            arrayParams: ['tag'],
            cache: CACHE,
            fetch: fetchImpl,
          }),
        },
      })

    it('collects every value of a repeated key instead of keeping only the last', async () => {
      const upstream = vi.fn().mockResolvedValue({ ok: true })
      const proxy = buildArrayProxy(upstream)

      await send(proxy, 'tag=a&tag=c')

      expect(upstream).toHaveBeenCalledWith({ tag: ['a', 'c'] })
    })

    it('shares one cache entry across orderings of the same values', async () => {
      const upstream = vi.fn().mockResolvedValue({ ok: true })
      const proxy = buildArrayProxy(upstream)

      await send(proxy, 'tag=a&tag=c')
      await send(proxy, 'tag=c&tag=a')

      expect(upstream).toHaveBeenCalledTimes(1)
    })

    it('keys distinct value sets separately rather than joining them into one value', async () => {
      const upstream = vi.fn().mockResolvedValue({ ok: true })
      const proxy = buildArrayProxy(upstream)

      await send(proxy, 'tag=a&tag=b')
      await send(proxy, 'tag=a')
      await send(proxy, 'tag=b')

      expect(upstream).toHaveBeenCalledTimes(3)
    })
  })

  describe('metrics', () => {
    type Labels = Record<string, string | number>

    const read = async (metric: { get: () => Promise<{ values: { labels: Labels; value: number }[] }> }) =>
      (await metric.get()).values

    const valueOf = (values: { labels: Labels; value: number }[], labels: Labels) =>
      values.find(entry => Object.entries(labels).every(([key, value]) => entry.labels[key] === value))?.value

    beforeEach(() => {
      metrics.cacheRequests.reset()
      metrics.upstreamRequests.reset()
      metrics.upstreamDuration.reset()
      metrics.httpResponses.reset()
    })

    it('counts a miss then a hit for the same key', async () => {
      const proxy = buildProxy(vi.fn().mockResolvedValue({ ok: true }))

      await send(proxy)
      await send(proxy)

      const values = await read(metrics.cacheRequests)
      expect(valueOf(values, { name: 'test', path: '', result: 'miss' })).toBe(1)
      expect(valueOf(values, { name: 'test', path: '', result: 'hit' })).toBe(1)
    })

    it('records the upstream outcome and its duration', async () => {
      const proxy = buildProxy(vi.fn().mockRejectedValue(new UpstreamError('test-upstream', 503)))

      await send(proxy)

      expect(valueOf(await read(metrics.upstreamRequests), { name: 'test', outcome: 'upstream_error' })).toBe(1)
      expect(valueOf(await read(metrics.upstreamDuration), { name: 'test', path: '' })).toBeGreaterThanOrEqual(0)
    })

    it('distinguishes a definitive miss from an upstream failure', async () => {
      const proxy = buildProxy(vi.fn().mockRejectedValue(new NotFoundError()))

      await send(proxy)

      expect(valueOf(await read(metrics.upstreamRequests), { name: 'test', outcome: 'not_found' })).toBe(1)
    })

    it('labels responses by route template, collapsing unlisted paths into one series', async () => {
      const proxy = buildProxy(vi.fn().mockResolvedValue({ ok: true }))

      await send(proxy)
      await proxy.handle(new NextRequest(new URL('http://localhost/api/test/a')), Promise.resolve({ path: ['a'] }))
      await proxy.handle(new NextRequest(new URL('http://localhost/api/test/b')), Promise.resolve({ path: ['b'] }))

      const values = await read(metrics.httpResponses)
      expect(valueOf(values, { route: '/api/test', status: '200' })).toBe(1)
      expect(valueOf(values, { route: '/api/test/*', status: '404' })).toBe(2)
    })
  })
})
