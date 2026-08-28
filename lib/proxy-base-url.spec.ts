import { afterEach, describe, expect, it, vi } from 'vitest'
import { INDEXER_PROXY_BASE } from '@/lib/indexer-proxy'
import { proxyBaseUrl } from '@/lib/proxy-base-url'

// Vitest runs these in jsdom, so `window` has to be removed to reach the server branch.
const onServer = <T>(read: () => T): T => {
  const { window } = globalThis
  Reflect.deleteProperty(globalThis, 'window')
  try {
    return read()
  } finally {
    Object.defineProperty(globalThis, 'window', { value: window, configurable: true, writable: true })
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('proxyBaseUrl', () => {
  it('stays relative in the browser, where the origin is the viewer’s', () => {
    expect(proxyBaseUrl(INDEXER_PROXY_BASE)).toBe(INDEXER_PROXY_BASE)
  })

  it('is absolute during a server render, which has no document origin to resolve against', () => {
    expect(onServer(() => proxyBaseUrl(INDEXER_PROXY_BASE))).toBe(`http://127.0.0.1:3000${INDEXER_PROXY_BASE}`)
  })

  it('follows PORT, so a container not on 3000 still reaches its own handler', () => {
    vi.stubEnv('PORT', '8080')

    expect(onServer(() => proxyBaseUrl(INDEXER_PROXY_BASE))).toBe(`http://127.0.0.1:8080${INDEXER_PROXY_BASE}`)
  })

  it('lets INTERNAL_ORIGIN override the loopback default', () => {
    vi.stubEnv('INTERNAL_ORIGIN', 'http://explorer.internal:9000')

    expect(onServer(() => proxyBaseUrl(INDEXER_PROXY_BASE))).toBe(`http://explorer.internal:9000${INDEXER_PROXY_BASE}`)
  })
})
