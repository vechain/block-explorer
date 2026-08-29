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
    vi.unstubAllEnvs()
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
      const { VALIDATOR_SLOTS_ANCHOR_SECONDS } = await import('@/lib/indexer-proxy')

      // Exempt because it is not point-in-time chain state: a seven-day ratio cannot move
      // inside one window, and its caller anchors the key to that same period. Adding to
      // this has to be a deliberate edit — one block is the rule for everything else.
      const windowedAggregates: Record<string, number> = {
        'validators/slots': VALIDATOR_SLOTS_ANCHOR_SECONDS,
      }

      // async-cache-dedupe stores an entry for ttl + stale and serves it for that whole
      // window, so that sum is the real staleness bound. Every indexer profile is fixed;
      // none defers its lifetime to the response the way a block does.
      for (const [path, endpoint] of Object.entries(INDEXER_ENDPOINTS)) {
        const { ttl, stale } = endpoint.cache
        if (typeof ttl !== 'number') throw new Error(`${path} defers its lifetime to the response`)

        const bound = windowedAggregates[path] ?? BLOCK_TIME_SECONDS
        expect({ path, maxAge: ttl + stale }).toEqual({ path, maxAge: bound })
      }
    })
  })

  describe('request validation', () => {
    it('404s an endpoint that is not in the registry, so this is not an open proxy', async () => {
      const response = await call('http://localhost/api/indexer/accounts/nfts?network=mainnet', ['accounts', 'nfts'])

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

  // Every page past the first is reached by replaying the cursor the previous page
  // returned, so a format the proxy rejects makes only page 1 reachable.
  describe('cursor pagination', () => {
    const CURSOR = '25724813|2'

    it('forwards the blockNumber|index cursor the indexer hands back', async () => {
      const response = await call(
        latestUrl(`network=mainnet&size=10&cursor=${encodeURIComponent(CURSOR)}`),
        LATEST_PATH,
      )

      expect(response.status).toBe(200)
      expect(new URL(requestedUrls(fetchMock)[0]).searchParams.get('cursor')).toBe(CURSOR)
    })

    it('forwards the cursor on transfers too', async () => {
      const response = await call(
        latestTransfersUrl(`network=mainnet&size=10&cursor=${encodeURIComponent(CURSOR)}`),
        LATEST_TRANSFERS_PATH,
      )

      expect(response.status).toBe(200)
      expect(new URL(requestedUrls(fetchMock)[0]).searchParams.get('cursor')).toBe(CURSOR)
    })

    it('keys each cursor separately so page 2 is not served page 1', async () => {
      fetchMock.mockImplementation((url: URL) =>
        Promise.resolve(jsonResponse({ cursor: url.searchParams.get('cursor') })),
      )

      const first = await call(latestUrl('network=mainnet&size=10'), LATEST_PATH)
      const second = await call(latestUrl(`network=mainnet&size=10&cursor=${encodeURIComponent(CURSOR)}`), LATEST_PATH)

      expect(await first.json()).toEqual({ cursor: null })
      expect(await second.json()).toEqual({ cursor: CURSOR })
    })

    it('400s a cursor carrying characters the upstream format never produces', async () => {
      const response = await call(latestUrl('network=mainnet&size=10&cursor=25724813%7C2%3Cscript%3E'), LATEST_PATH)

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
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

  // These carry the address in the upstream path but take it as a query param, since the
  // proxy keys an entry on its own path plus the validated query.
  describe('path-parameter endpoints', () => {
    it('splices the address into the upstream path and does not forward it as a query param', async () => {
      await call(`http://localhost/api/indexer/accounts/overview?network=mainnet&address=${ADDRESS}`, [
        'accounts',
        'overview',
      ])

      const url = new URL(requestedUrls(fetchMock)[0])
      expect(url.pathname).toBe(`/api/v1/accounts/overview/${ADDRESS}`)
      expect(url.searchParams.get('address')).toBeNull()
    })

    it('keys each address separately', async () => {
      const other = '0x0000000000000000000000000000000000000002'
      const GET = await importRoute()
      const send = (address: string) =>
        GET(request(`http://localhost/api/indexer/accounts/overview?network=mainnet&address=${address}`), {
          params: Promise.resolve({ path: ['accounts', 'overview'] }),
        })

      await send(ADDRESS)
      await send(other)

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('400s without the address, rather than proxying a bare collection path', async () => {
      const response = await call('http://localhost/api/indexer/accounts/overview?network=mainnet', [
        'accounts',
        'overview',
      ])

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('forwards the slots window alongside the spliced address', async () => {
      await call(
        `http://localhost/api/indexer/validators/slots?network=mainnet&address=${ADDRESS}&startTimestamp=1000&endTimestamp=2000`,
        ['validators', 'slots'],
      )

      const url = new URL(requestedUrls(fetchMock)[0])
      expect(url.pathname).toBe(`/api/v2/validators/${ADDRESS}/slots`)
      expect(Object.fromEntries(url.searchParams)).toEqual({ startTimestamp: '1000', endTimestamp: '2000' })
    })
  })

  describe('indexer API version', () => {
    it('sends v2 resources to /api/v2 and v1 resources to /api/v1', async () => {
      const GET = await importRoute()

      await GET(request('http://localhost/api/indexer/accounts/total?network=mainnet'), {
        params: Promise.resolve({ path: ['accounts', 'total'] }),
      })
      await GET(request('http://localhost/api/indexer/stargate/total-vet-staked?network=mainnet'), {
        params: Promise.resolve({ path: ['stargate', 'total-vet-staked'] }),
      })

      const urls = requestedUrls(fetchMock)
      expect(new URL(urls[0]).pathname).toBe('/api/v2/accounts/total')
      expect(new URL(urls[1]).pathname).toBe('/api/v1/stargate/total-vet-staked')
    })
  })

  describe('validators', () => {
    const validatorsUrl = (query: string) => `http://localhost/api/indexer/validators?${query}`

    it('keys an endorser-filtered list apart from the unfiltered one', async () => {
      const GET = await importRoute()
      const send = (query: string) =>
        GET(request(validatorsUrl(query)), { params: Promise.resolve({ path: ['validators'] }) })

      await send('network=mainnet&page=0&size=150')
      await send(`network=mainnet&page=0&size=150&endorser=${ADDRESS}`)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(new URL(requestedUrls(fetchMock)[0]).searchParams.get('endorser')).toBeNull()
      expect(new URL(requestedUrls(fetchMock)[1]).searchParams.get('endorser')).toBe(ADDRESS)
    })

    it('accepts the status filter and rejects one the indexer does not define', async () => {
      const accepted = await call(validatorsUrl('network=mainnet&page=0&size=150&status=ACTIVE'), ['validators'])
      const rejected = await call(validatorsUrl('network=mainnet&page=0&size=150&status=SLASHED'), ['validators'])

      expect(accepted.status).toBe(200)
      expect(rejected.status).toBe(400)
    })

    it('keys each delegations page separately', async () => {
      const GET = await importRoute()
      const send = (page: number) =>
        GET(
          request(
            `http://localhost/api/indexer/validators/delegations?network=mainnet&validator=${ADDRESS}&page=${page}&size=100`,
          ),
          { params: Promise.resolve({ path: ['validators', 'delegations'] }) },
        )

      await send(0)
      await send(1)

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  // The address page reads these from the browser on every visit, so an over-eager
  // default here would change the upstream request rather than just the cache key.
  describe('contract, token and NFT endpoints', () => {
    it('splices the contract address into the upstream path', async () => {
      await call(`http://localhost/api/indexer/contracts/details?network=mainnet&address=${ADDRESS}`, [
        'contracts',
        'details',
      ])

      const url = new URL(requestedUrls(fetchMock)[0])
      expect(url.pathname).toBe(`/api/v1/contracts/${ADDRESS}`)
      expect(url.searchParams.get('address')).toBeNull()
    })

    it('keeps the paging params alongside the spliced master address', async () => {
      await call(`http://localhost/api/indexer/contracts/by-master?network=mainnet&address=${ADDRESS}&page=2&size=25`, [
        'contracts',
        'by-master',
      ])

      const url = new URL(requestedUrls(fetchMock)[0])
      expect(url.pathname).toBe(`/api/v1/contracts/by-master/${ADDRESS}`)
      expect(Object.fromEntries(url.searchParams)).toEqual({ page: '2', size: '25' })
    })

    it('omits a direction the caller never sent, rather than defaulting it', async () => {
      await call(`http://localhost/api/indexer/nfts?network=mainnet&address=${ADDRESS}&page=0&size=10`, ['nfts'])

      const forwarded = new URL(requestedUrls(fetchMock)[0]).searchParams
      expect(forwarded.get('direction')).toBeNull()
      expect(forwarded.get('officialTokensOnly')).toBeNull()
    })

    it('keys each NFT page separately', async () => {
      const GET = await importRoute()
      const send = (page: number) =>
        GET(request(`http://localhost/api/indexer/nfts?network=mainnet&address=${ADDRESS}&page=${page}&size=10`), {
          params: Promise.resolve({ path: ['nfts'] }),
        })

      await send(0)
      await send(1)

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const historyUrl = (tokenId: string) =>
      `http://localhost/api/indexer/nfts/history?network=mainnet&contractAddress=${ADDRESS}&tokenId=${tokenId}&page=0&size=20`

    it('accepts the largest uint256 token id', async () => {
      const response = await call(historyUrl((2n ** 256n - 1n).toString()), ['nfts', 'history'])

      expect(response.status).toBe(200)
    })

    it.each([
      ['a non-decimal id', '0x01'],
      // 78 digits, but above the uint256 maximum — length alone would let this through.
      ['an id past the uint256 maximum', '9'.repeat(78)],
    ])('400s %s', async (_label, tokenId) => {
      const response = await call(historyUrl(tokenId), ['nfts', 'history'])

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('treats a leading-zero token id as the same entry, not a second spelling', async () => {
      const GET = await importRoute()
      const send = (tokenId: string) =>
        GET(request(historyUrl(tokenId)), { params: Promise.resolve({ path: ['nfts', 'history'] }) })

      await send('7')
      await send('007')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(new URL(requestedUrls(fetchMock)[0]).searchParams.get('tokenId')).toBe('7')
    })

    it('400s the token list without an address, so it cannot be paged unscoped', async () => {
      const response = await call('http://localhost/api/indexer/transfers/fungible-tokens-contracts?network=mainnet', [
        'transfers',
        'fungible-tokens-contracts',
      ])

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('accepts the token page size the account page actually asks for', async () => {
      const response = await call(
        `http://localhost/api/indexer/transfers/fungible-tokens-contracts?network=mainnet&address=${ADDRESS}&size=100`,
        ['transfers', 'fungible-tokens-contracts'],
      )

      expect(response.status).toBe(200)
    })
  })

  describe('rate limit bypass', () => {
    const headersOfFirstCall = () => (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>

    const send = async (token?: string) => {
      if (token !== undefined) vi.stubEnv('INDEXER_RATE_LIMIT_BYPASS', token)
      await call(latestUrl('network=mainnet&size=5'), LATEST_PATH)
      return headersOfFirstCall()
    }

    it('sends the token so the indexer does not rate limit every user against one proxy IP', async () => {
      expect(await send('s3cret')).toMatchObject({ 'x-rate-limit-bypass': 's3cret' })
    })

    it('keeps the project header alongside it', async () => {
      expect(await send('s3cret')).toMatchObject({ 'X-Project-Id': 'block-explorer' })
    })

    it('omits the header when no token is configured', async () => {
      expect(await send()).not.toHaveProperty('x-rate-limit-bypass')
    })

    it('treats the blank Terraform placeholder as no token, rather than sending a bogus one', async () => {
      expect(await send(' ')).not.toHaveProperty('x-rate-limit-bypass')
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
