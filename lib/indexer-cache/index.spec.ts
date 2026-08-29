import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCachedProxy } from '@/lib/cached-proxy'
import { metrics } from '@/lib/metrics'
import { INDEXER_ENDPOINTS } from './index'

const ADDRESS = `0x${'ab'.repeat(20)}`

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

// The three address-scoped lookups the indexer answers 404 for when it holds no record.
const ADDRESS_LOOKUPS = [
  { path: 'accounts/overview', message: 'Account overview not found' },
  { path: 'validators/details', message: 'Validator not found' },
  { path: 'contracts/details', message: 'Contract not found' },
]

let fetchMock: ReturnType<typeof vi.fn>

const buildProxy = () => createCachedProxy({ name: 'indexer', endpoints: INDEXER_ENDPOINTS })

const send = (proxy: ReturnType<typeof buildProxy>, path: string, query: string) =>
  proxy.handle(
    new NextRequest(new URL(`http://localhost/api/indexer/${path}?${query}`)),
    Promise.resolve({ path: path.split('/') }),
  )

describe('INDEXER_ENDPOINTS', () => {
  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })))
    vi.stubGlobal('fetch', fetchMock)
    metrics.upstreamRequests.reset()
    metrics.httpResponses.reset()
  })
  afterEach(() => vi.unstubAllGlobals())

  describe.each(ADDRESS_LOOKUPS)('$path', ({ path, message }) => {
    beforeEach(() => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ status: 404 }, 404)))
    })

    it('answers a 404 with a cached 404 rather than a 502', async () => {
      const proxy = buildProxy()

      const first = await send(proxy, path, `network=mainnet&address=${ADDRESS}`)
      const second = await send(proxy, path, `network=mainnet&address=${ADDRESS}`)

      expect(first.status).toBe(404)
      await expect(first.json()).resolves.toMatchObject({ message })
      expect(second.status).toBe(404)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(first.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=120, stale-while-revalidate=120')
    })

    // Both the 5xx and the upstream-error alert used to fire on ordinary address traffic.
    it('counts the 404 as a definitive miss, not an upstream error', async () => {
      await send(buildProxy(), path, `network=mainnet&address=${ADDRESS}`)

      const outcomes = (await metrics.upstreamRequests.get()).values
      const outcomeOf = (outcome: string) =>
        outcomes.find(entry => entry.labels.path === path && entry.labels.outcome === outcome)?.value

      expect(outcomeOf('not_found')).toBe(1)
      expect(outcomeOf('upstream_error')).toBeUndefined()
    })

    it('still reports a genuine upstream failure as a 502', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(new Response('nope', { status: 503 })))

      const response = await send(buildProxy(), path, `network=mainnet&address=${ADDRESS}`)

      expect(response.status).toBe(502)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    })
  })

  // A 404 here means the upstream route is gone, which is a fault rather than an answer.
  it('leaves a 404 on a collection endpoint uncached and unclaimed as a not-found', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ status: 404 }, 404)))
    const proxy = buildProxy()

    const response = await send(proxy, 'transactions/latest', 'network=mainnet&size=10')
    await send(proxy, 'transactions/latest', 'network=mainnet&size=10')

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const outcomes = (await metrics.upstreamRequests.get()).values
    expect(
      outcomes.find(entry => entry.labels.path === 'transactions/latest' && entry.labels.outcome === 'upstream_error')
        ?.value,
    ).toBe(2)
  })

  it('serves a found record from cache and does not negative-cache it', async () => {
    const proxy = buildProxy()

    const first = await send(proxy, 'validators/details', `network=mainnet&address=${ADDRESS}`)
    await send(proxy, 'validators/details', `network=mainnet&address=${ADDRESS}`)

    expect(first.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toBe(`https://indexer.mainnet.test/api/v2/validators/${ADDRESS}`)
  })
})
