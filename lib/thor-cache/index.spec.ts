import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCachedProxy } from '@/lib/cached-proxy'
import { THOR_ENDPOINTS } from './index'

const BLOCK = { number: 123, id: '0x'.padEnd(66, 'a'), isFinalized: false }

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

let fetchMock: ReturnType<typeof vi.fn>

const buildProxy = () => createCachedProxy({ name: 'thor', endpoints: THOR_ENDPOINTS })

const send = (proxy: ReturnType<typeof buildProxy>, path: string, query: string) =>
  proxy.handle(
    new NextRequest(new URL(`http://localhost/api/thor/${path}?${query}`)),
    Promise.resolve({ path: path.split('/') }),
  )

const requestedUrl = (call: number) => String(fetchMock.mock.calls[call][0])

describe('THOR_ENDPOINTS', () => {
  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse(BLOCK)))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('serves a block from cache on the second request', async () => {
    const proxy = buildProxy()

    const first = await send(proxy, 'blocks', 'network=mainnet&revision=123')
    await send(proxy, 'blocks', 'network=mainnet&revision=123')

    await expect(first.json()).resolves.toEqual(BLOCK)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestedUrl(0)).toBe('https://mainnet.vechain.org/blocks/123')
  })

  it('gives an immutable block a lifetime far longer than a block time', async () => {
    const response = await send(buildProxy(), 'blocks', 'network=mainnet&revision=123')

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=600, s-maxage=600, stale-while-revalidate=600')
  })

  it('keeps the head on a half-block lifetime, not the immutable one', async () => {
    const response = await send(buildProxy(), 'blocks/best', 'network=mainnet')

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=5, stale-while-revalidate=5')
    expect(requestedUrl(0)).toBe('https://mainnet.vechain.org/blocks/best')
  })

  it('requests and caches the expanded form separately from the compressed one', async () => {
    const proxy = buildProxy()

    await send(proxy, 'blocks', 'network=mainnet&revision=123&expanded=true')
    await send(proxy, 'blocks', 'network=mainnet&revision=123&expanded=false')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requestedUrl(0)).toBe('https://mainnet.vechain.org/blocks/123?expanded=true')
    expect(requestedUrl(1)).toBe('https://mainnet.vechain.org/blocks/123')
  })

  it('routes each network to its own node', async () => {
    const proxy = buildProxy()

    await send(proxy, 'blocks', 'network=testnet&revision=123')

    expect(requestedUrl(0)).toBe('https://testnet.vechain.org/blocks/123')
  })

  it("turns Thor's null body into a cached 404 rather than caching a null block", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(null)))
    const proxy = buildProxy()

    const first = await send(proxy, 'blocks', 'network=mainnet&revision=99999999')
    const second = await send(proxy, 'blocks', 'network=mainnet&revision=99999999')

    expect(first.status).toBe(404)
    expect(second.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // Short-lived: a revision ahead of the head becomes a real block later.
    expect(first.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=10, stale-while-revalidate=10')
  })

  it('rejects an alias revision so it cannot land under the immutable lifetime', async () => {
    const proxy = buildProxy()

    for (const revision of ['best', 'finalized', 'next', 'justified']) {
      const response = await send(proxy, 'blocks', `network=mainnet&revision=${revision}`)
      expect(response.status).toBe(400)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects solo, whose node URL is unresolvable server-side', async () => {
    const response = await send(buildProxy(), 'blocks', 'network=solo&revision=123')

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never caches an upstream failure', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('nope', { status: 503 })))
    const proxy = buildProxy()

    const first = await send(proxy, 'blocks', 'network=mainnet&revision=123')
    await send(proxy, 'blocks', 'network=mainnet&revision=123')

    expect(first.status).toBe(502)
    expect(first.headers.get('Cache-Control')).toBe('no-store')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('revision parsing', () => {
  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse(BLOCK)))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('accepts a block ID without reading it as a hex number', async () => {
    const blockId = `0x${'0'.repeat(63)}1`
    await send(buildProxy(), 'blocks', `network=mainnet&revision=${blockId}`)

    expect(requestedUrl(0)).toBe(`https://mainnet.vechain.org/blocks/${blockId}`)
  })

  it('rejects a hex-spelled block number so it cannot fork the cache', async () => {
    const response = await send(buildProxy(), 'blocks', 'network=mainnet&revision=0x7b')

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
