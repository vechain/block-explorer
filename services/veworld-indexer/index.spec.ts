import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_WINDOW_KEY } from '@/lib/runtime-config/types'

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

describe('indexerCachedGet', () => {
  beforeEach(() => {
    get.mockClear()
  })

  afterEach(() => {
    Reflect.deleteProperty(window, RUNTIME_CONFIG_WINDOW_KEY)
  })

  it('routes a cached endpoint through the server-side proxy', async () => {
    const indexerCachedGet = await importSubject()
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'transactions/latest' })

    expect(baseUrlOf()).toBe('/api/indexer')
    expect(paramsOf()).toMatchObject({ network: NetworkName.MAINNET })
  })

  it('goes direct to the indexer for an endpoint the proxy does not cache', async () => {
    const indexerCachedGet = await importSubject()
    await indexerCachedGet({ networkName: NetworkName.MAINNET, endPoint: 'nfts' })

    expect(baseUrlOf()).not.toBe('/api/indexer')
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
