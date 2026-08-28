import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_WINDOW_KEY } from '@/lib/runtime-config/types'

const ADDRESS = '0x0000000000000000000000000000000000000001'

const get = vi.fn().mockResolvedValue({ data: {} })

vi.mock('@/lib/api', () => ({ apiClient: { get } }))

// These services only ever run in the browser, where the flag arrives on `window` via
// <RuntimeConfigScript> rather than from process.env.
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

  // The address page prefetches six of these during SSR, where a relative URL makes
  // `fetch` throw ERR_INVALID_URL and the page silently loses its server-rendered data.
  it('gives the proxy an absolute base during a server render', async () => {
    const { window: saved } = globalThis
    Reflect.deleteProperty(globalThis, 'window')
    try {
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'accounts/overview' })
    } finally {
      Object.defineProperty(globalThis, 'window', { value: saved, configurable: true, writable: true })
    }

    expect(() => new URL(pathOf())).not.toThrow()
    expect(pathOf()).toBe('http://127.0.0.1:3000/api/indexer/accounts/overview')
  })

  it('routes a cached endpoint through the server-side proxy', async () => {
    const indexerCachedGet = await importSubject()
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transactions/latest' })

    expect(baseUrlOf()).toBe('/api/indexer')
    expect(paramsOf()).toMatchObject({ network: NetworkName.MAINNET })
  })

  it.each(['explorer/block-usage', '/explorer/block-usage'])('builds a joinable proxy path from %s', async endPoint => {
    const indexerCachedGet = await importSubject()
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint })

    expect(pathOf()).toBe('/api/indexer/explorer/block-usage')
  })

  it('goes direct to the indexer for an endpoint the proxy does not cache', async () => {
    const indexerCachedGet = await importSubject()
    // Synthetic on purpose: naming a real path makes this fail the day it gets registered.
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'not-proxied' })

    expect(baseUrlOf()).not.toBe('/api/indexer')
  })

  // A registry key is slashless, so the direct fallback has to add the separator the
  // versioned base URL does not carry.
  describe('direct fallback', () => {
    it.each(['validators', '/validators'])('builds a joinable upstream path from %s', async endPoint => {
      setBypass(true)
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint })

      expect(pathOf()).toMatch(/\/api\/v1\/validators$/)
    })

    it('uses the direct descriptor’s path and version over the registry key', async () => {
      setBypass(true)
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

    it('keeps solo off the proxy, whose indexer URL only exists in the browser', async () => {
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.SOLO, endPoint: 'accounts/total' })

      expect(baseUrlOf()).not.toBe('/api/indexer')
      expect(pathOf()).toMatch(/\/accounts\/total$/)
    })
  })

  // The escape hatch for the indexer's WAF rate limiting our single egress IP: every
  // call must leave from the viewer's own IP instead, so none may reach the proxy.
  describe('bypassIndexerProxy', () => {
    it('sends a cached endpoint direct to the indexer, not the proxy', async () => {
      setBypass(true)
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transactions/latest' })

      expect(baseUrlOf()).toContain('/api/v1')
      expect(baseUrlOf()).not.toBe('/api/indexer')
    })

    it('drops the proxy-only network param, which the indexer does not accept', async () => {
      setBypass(true)
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transfers/latest', params: { size: '10' } })

      expect(paramsOf()).toEqual({ size: '10' })
    })

    it('keeps the proxy when false, so the bypass has to be opted into', async () => {
      setBypass(false)
      const indexerCachedGet = await importSubject()
      await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transactions/latest' })

      expect(baseUrlOf()).toBe('/api/indexer')
    })
  })
})
