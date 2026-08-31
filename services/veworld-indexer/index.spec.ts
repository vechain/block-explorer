import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_WINDOW_KEY } from '@/lib/runtime-config/types'

const ADDRESS = '0x0000000000000000000000000000000000000001'

const get = vi.fn().mockResolvedValue({ data: {} })

// Only the client is stubbed: `indexerCachedGetOrNull` matches on the real `ApiError`.
vi.mock('@/lib/api', async () => ({ apiClient: { get }, ApiError: (await import('@/lib/api/types')).ApiError }))

// These services only ever run in the browser, where the flag arrives on `window` via
// <RuntimeConfigProvider> rather than from process.env.
const setBypass = (bypassIndexerProxy: boolean) => {
  Object.assign(window, { [RUNTIME_CONFIG_WINDOW_KEY]: { ...DEFAULT_RUNTIME_CONFIG, bypassIndexerProxy } })
}

const importSubject = async () => {
  vi.resetModules()
  const { indexerCachedGet } = await import('./index')
  return indexerCachedGet
}

const baseUrlOf = () => get.mock.calls[0][0].baseUrl as string
const paramsOf = () => get.mock.calls[0][0].params as Record<string, string> | undefined
// The client joins baseUrl and endPoint bare, so only the pair together shows a missing slash.
const pathOf = () => `${baseUrlOf()}${get.mock.calls[0][0].endPoint as string}`

describe('indexerCachedGet', () => {
  beforeEach(() => {
    get.mockClear()
  })

  afterEach(() => {
    Reflect.deleteProperty(window, RUNTIME_CONFIG_WINDOW_KEY)
  })

  // `network` selects the proxy's upstream host; the indexer itself rejects it.
  it('sends a cached endpoint straight to the indexer, without the proxy-only param', async () => {
    const indexerCachedGet = await importSubject()
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transfers/latest', params: { size: '10' } })

    expect(baseUrlOf()).toContain('/api/v1')
    expect(paramsOf()).toEqual({ size: '10' })
  })

  // A registry key is slashless, so the direct call has to add the separator the
  // versioned base URL does not carry.
  describe('upstream paths', () => {
    it.each(['validators', '/validators'])('builds a joinable upstream path from %s', async endPoint => {
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint })

      expect(pathOf()).toMatch(/\/api\/v1\/validators$/)
    })

    it('uses the direct descriptor’s path and version over the registry key', async () => {
      const indexerCachedGet = await importSubject()
      const { IndexerVersion } = await import('./index')
      await indexerCachedGet({
        networkName: NetworkName.MAINNET,
        endPoint: 'validators/details',
        params: { address: ADDRESS },
        direct: { endPoint: `/validators/${ADDRESS}`, params: {}, version: IndexerVersion.V2 },
      })

      expect(pathOf()).toMatch(new RegExp(`/api/v2/validators/${ADDRESS}$`))
      expect(paramsOf()).toEqual({})
    })

    it('reaches solo, whose indexer URL only exists in the browser', async () => {
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.SOLO, endPoint: 'accounts/total' })

      expect(pathOf()).toMatch(/\/accounts\/total$/)
    })
  })

  // The one lever left for putting the indexer's load back behind our shared egress IP.
  describe('BYPASS_INDEXER_PROXY=false', () => {
    it('routes a cached endpoint back through the server-side proxy', async () => {
      setBypass(false)
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transactions/latest' })

      expect(baseUrlOf()).toBe('/api/indexer')
      expect(paramsOf()).toMatchObject({ network: NetworkName.MAINNET })
    })

    it('still sends an endpoint the proxy does not cache direct', async () => {
      setBypass(false)
      const indexerCachedGet = await importSubject()
      // Synthetic on purpose: naming a real path makes this fail the day it gets registered.
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'not-proxied' })

      expect(baseUrlOf()).not.toBe('/api/indexer')
    })
  })
})

describe('indexerCachedGetOrNull', () => {
  const lookup = { networkName: NetworkName.MAINNET, endPoint: 'contracts/details', params: { address: ADDRESS } }

  // `ApiError` comes from the reset graph too: the subject matches on identity, and the
  // spec's own top-level binding survives resetModules as a different class.
  const importSubject = async () => {
    vi.resetModules()
    const { indexerCachedGetOrNull } = await import('./index')
    const { ApiError } = await import('@/lib/api')
    return { indexerCachedGetOrNull, ApiError }
  }

  beforeEach(() => {
    get.mockClear()
  })

  afterEach(() => {
    Reflect.deleteProperty(window, RUNTIME_CONFIG_WINDOW_KEY)
  })

  it('unwraps the record where the lookup finds one', async () => {
    const { indexerCachedGetOrNull } = await importSubject()
    get.mockResolvedValueOnce({ data: { master: ADDRESS } })

    await expect(indexerCachedGetOrNull(lookup)).resolves.toEqual({ master: ADDRESS })
  })

  it('turns a 404 into an absent record rather than an error', async () => {
    setBypass(false)
    const { indexerCachedGetOrNull, ApiError } = await importSubject()
    get.mockRejectedValueOnce(new ApiError({ status: 404 }))

    await expect(indexerCachedGetOrNull(lookup)).resolves.toBeNull()
  })

  it('absorbs the indexer’s own 404 on the direct path', async () => {
    const { indexerCachedGetOrNull, ApiError } = await importSubject()
    get.mockRejectedValueOnce(new ApiError({ status: 404 }))

    await expect(indexerCachedGetOrNull(lookup)).resolves.toBeNull()
    expect(baseUrlOf()).not.toBe('/api/indexer')
  })

  it.each([400, 429, 502, 504])('rethrows a %d rather than reporting an absent record', async status => {
    const { indexerCachedGetOrNull, ApiError } = await importSubject()
    get.mockRejectedValueOnce(new ApiError({ status }))

    await expect(indexerCachedGetOrNull(lookup)).rejects.toMatchObject({ status })
  })
})
