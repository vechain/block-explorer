import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MAINNET_HOST = 'https://indexer.mainnet.test'
const TESTNET_HOST = 'https://indexer.testnet.test'

type RouteGet = (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => Promise<Response>

const importRoute = async (): Promise<RouteGet> => {
  vi.resetModules()
  const { GET } = await import('./route')
  return GET as RouteGet
}

const request = (url: string) => new NextRequest(new URL(url))

const latestUrl = (query: string) => `http://localhost/api/indexer/transactions/latest?${query}`
const LATEST_PATH = ['transactions', 'latest']

const latestTransfersUrl = (query: string) => `http://localhost/api/indexer/transfers/latest?${query}`
const LATEST_TRANSFERS_PATH = ['transfers', 'latest']

const ADDRESS = '0x0000000000000000000000000000000000000001'

const jsonResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response

const requestedUrls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([url]) => (url instanceof URL ? url.toString() : String(url)))

describe('GET /api/indexer/[...path]', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [], pagination: { hasNext: false } }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const call = async (url: string, path: string[]) => {
    const GET = await importRoute()
    return GET(request(url), { params: Promise.resolve({ path }) })
  }

  describe('network isolation', () => {
    it('keeps mainnet and testnet in separate cache entries for identical params', async () => {
      const GET = await importRoute()
      fetchMock.mockImplementation((url: URL) =>
        Promise.resolve(jsonResponse({ network: url.toString().startsWith(MAINNET_HOST) ? 'mainnet' : 'testnet' })),
      )

      const mainnet = await GET(request(latestUrl('network=mainnet&size=5')), {
        params: Promise.resolve({ path: LATEST_PATH }),
      })
      const testnet = await GET(request(latestUrl('network=testnet&size=5')), {
        params: Promise.resolve({ path: LATEST_PATH }),
      })

      await expect(mainnet.json()).resolves.toEqual({ network: 'mainnet' })
      await expect(testnet.json()).resolves.toEqual({ network: 'testnet' })
      expect(fetchMock).toHaveBeenCalledTimes(2)

      const urls = requestedUrls(fetchMock)
      expect(urls[0].startsWith(`${MAINNET_HOST}/api/v1/transactions/latest`)).toBe(true)
      expect(urls[1].startsWith(`${TESTNET_HOST}/api/v1/transactions/latest`)).toBe(true)
    })

    it('rejects solo, whose indexer URL only exists in the browser', async () => {
      const response = await call(latestUrl('network=solo&size=5'), LATEST_PATH)

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rejects a missing network rather than defaulting to mainnet', async () => {
      const response = await call(latestUrl('size=5'), LATEST_PATH)

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rejects an unrecognised network', async () => {
      const response = await call(latestUrl('network=mainnet-staging&size=5'), LATEST_PATH)

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('never forwards network as a query param to the indexer', async () => {
      await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)

      expect(new URL(requestedUrls(fetchMock)[0]).searchParams.get('network')).toBeNull()
    })
  })

  describe('caching', () => {
    it('serves a repeat request within the TTL from cache', async () => {
      const GET = await importRoute()
      const send = () =>
        GET(request(latestUrl('network=mainnet&size=5')), { params: Promise.resolve({ path: LATEST_PATH }) })

      await send()
      await send()

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('coalesces concurrent misses into a single upstream request', async () => {
      const GET = await importRoute()
      let release: (value: Response) => void = () => {}
      fetchMock.mockReturnValue(
        new Promise<Response>(resolve => {
          release = resolve
        }),
      )

      const inFlight = Array.from({ length: 25 }, () =>
        GET(request(latestUrl('network=mainnet&size=5')), { params: Promise.resolve({ path: LATEST_PATH }) }),
      )

      // Hold upstream open until every request is past the cache lookup, so a pass here
      // cannot come from later requests hitting an already-warm entry.
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      release(jsonResponse({ data: [] }))
      const responses = await Promise.all(inFlight)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(responses.every(response => response.status === 200)).toBe(true)
    })

    it('is insensitive to query parameter order', async () => {
      const GET = await importRoute()

      await GET(request(latestUrl('network=mainnet&size=5&expanded=false')), {
        params: Promise.resolve({ path: LATEST_PATH }),
      })
      await GET(request(latestUrl('expanded=false&size=5&network=mainnet')), {
        params: Promise.resolve({ path: LATEST_PATH }),
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('advertises the endpoint TTL', async () => {
      const response = await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)

      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=5, stale-while-revalidate=5')
    })

    it('never serves chain state older than one block', async () => {
      const { INDEXER_ENDPOINTS } = await import('@/lib/indexer-cache')
      const { BLOCK_TIME_SECONDS } = await import('@/lib/constants/network')

      // async-cache-dedupe stores an entry for ttl + stale and serves it for that whole
      // window, so that sum is the real staleness bound.
      for (const [path, endpoint] of Object.entries(INDEXER_ENDPOINTS)) {
        expect({ path, maxAge: endpoint.cache.ttl + endpoint.cache.stale }).toEqual({
          path,
          maxAge: BLOCK_TIME_SECONDS,
        })
      }
    })
  })

  describe('request validation', () => {
    it('404s an endpoint that is not in the registry, so this is not an open proxy', async () => {
      const response = await call('http://localhost/api/indexer/accounts/totals?network=mainnet', [
        'accounts',
        'totals',
      ])

      expect(response.status).toBe(404)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('400s an undeclared query parameter instead of silently dropping it', async () => {
      const response = await call(
        'http://localhost/api/indexer/transactions?network=mainnet&origin=0x0000000000000000000000000000000000000001&sortBy=gas',
        ['transactions'],
      )

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('400s an out-of-range page size rather than caching it', async () => {
      const response = await call(latestUrl('network=mainnet&size=100000'), LATEST_PATH)

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('accepts and forwards direction and includeDelegated', async () => {
      await call(
        'http://localhost/api/indexer/transactions?network=mainnet&origin=0x0000000000000000000000000000000000000001&direction=ASC&includeDelegated=true',
        ['transactions'],
      )

      const forwarded = new URL(requestedUrls(fetchMock)[0]).searchParams
      expect(forwarded.get('direction')).toBe('ASC')
      expect(forwarded.get('includeDelegated')).toBe('true')
    })

    it('accepts the upstream maximum page size of 150', async () => {
      const response = await call(latestUrl('network=mainnet&size=150'), LATEST_PATH)

      expect(response.status).toBe(200)
    })
  })

  describe('transfers', () => {
    const sendLatestTransfers = async (query: string) => {
      const GET = await importRoute()
      return GET(request(latestTransfersUrl(query)), { params: Promise.resolve({ path: LATEST_TRANSFERS_PATH }) })
    }

    it('forwards a repeated eventType as repeated keys, not one comma-joined value', async () => {
      await call(latestTransfersUrl('network=mainnet&size=10&eventType=VET&eventType=NFT'), LATEST_TRANSFERS_PATH)

      const forwarded = new URL(requestedUrls(fetchMock)[0]).searchParams
      expect(forwarded.getAll('eventType')).toEqual(['VET', 'NFT'])
    })

    it('keys distinct eventType filters separately', async () => {
      const GET = await importRoute()
      const send = (query: string) =>
        GET(request(latestTransfersUrl(query)), { params: Promise.resolve({ path: LATEST_TRANSFERS_PATH }) })

      await send('network=mainnet&size=10&eventType=VET&eventType=FUNGIBLE_TOKEN')
      await send('network=mainnet&size=10&eventType=NFT')
      await send('network=mainnet&size=10')

      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('is insensitive to the order of a repeated eventType', async () => {
      const GET = await importRoute()
      const send = (query: string) =>
        GET(request(latestTransfersUrl(query)), { params: Promise.resolve({ path: LATEST_TRANSFERS_PATH }) })

      await send('network=mainnet&size=10&eventType=VET&eventType=FUNGIBLE_TOKEN')
      await send('network=mainnet&size=10&eventType=FUNGIBLE_TOKEN&eventType=VET')

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('400s an unrecognised eventType', async () => {
      const response = await sendLatestTransfers('network=mainnet&size=10&eventType=VET&eventType=SOMETHING')

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('400s expanded, which /transfers/latest does not accept', async () => {
      const response = await sendLatestTransfers('network=mainnet&size=10&expanded=true')

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('serves the address-scoped endpoint and forwards its filters', async () => {
      await call(
        `http://localhost/api/indexer/transfers?network=testnet&address=${ADDRESS}&tokenAddress=${ADDRESS}&eventType=VET&page=2&size=25`,
        ['transfers'],
      )

      const url = new URL(requestedUrls(fetchMock)[0])
      expect(url.toString().startsWith(`${TESTNET_HOST}/api/v1/transfers`)).toBe(true)
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        address: ADDRESS,
        tokenAddress: ADDRESS,
        eventType: 'VET',
        page: '2',
        size: '25',
        direction: 'DESC',
      })
      expect(url.searchParams.get('network')).toBeNull()
    })

    it('400s the address-scoped endpoint without an address', async () => {
      const response = await call('http://localhost/api/indexer/transfers?network=mainnet&eventType=VET', ['transfers'])

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('returns 502 without caching when the indexer fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response)

    const response = await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)

    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('reports an indexer timeout as a gateway error, not an application error', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }))

    const response = await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)

    expect(response.status).toBe(504)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('reports a transport failure as a gateway error', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const response = await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)

    expect(response.status).toBe(502)
  })
})
