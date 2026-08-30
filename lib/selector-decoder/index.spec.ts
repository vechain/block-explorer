import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCachedProxy } from '@/lib/cached-proxy'
import { selectorEndpoint } from './index'

const SELECTOR = '0xa9059cbb'
const QUERY = `kind=function&hash=${SELECTOR}`
const FRAGMENT = { type: 'function', name: 'transfer', inputs: [], outputs: [] }

let fetchMock: ReturnType<typeof vi.fn>

const buildProxy = () => createCachedProxy({ name: 'decode/selector', endpoints: { '': selectorEndpoint } })

const send = (proxy: ReturnType<typeof buildProxy>, query = QUERY) =>
  proxy.handle(new NextRequest(new URL(`http://localhost/api/decode/selector?${query}`)))

const known = () => new Response(JSON.stringify([FRAGMENT]), { status: 200 })
const unknown = () => new Response('{}', { status: 404 })
const openchainEmpty = () => new Response(JSON.stringify({ ok: true, result: { function: {} } }), { status: 200 })

const respond = (url: string) => (url.includes('openchain') ? openchainEmpty() : known())

describe('selectorEndpoint', () => {
  beforeEach(() => {
    fetchMock = vi.fn((url: string) => Promise.resolve(respond(String(url))))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('serves a known selector from cache on the second request', async () => {
    const proxy = buildProxy()

    const first = await send(proxy)
    await send(proxy)

    await expect(first.json()).resolves.toEqual({ source: 'b32', abi: FRAGMENT })
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('b32'))).toHaveLength(1)
  })

  it('keeps an unknown selector away from both sources on the second request', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(String(url).includes('openchain') ? openchainEmpty() : unknown()),
    )
    const proxy = buildProxy()

    const first = await send(proxy)
    const second = await send(proxy)

    expect([first.status, second.status]).toEqual([404, 404])
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('b32'))).toHaveLength(1)
  })

  it('caches a hash for a day in the browser, since a signature never changes', async () => {
    const response = await send(buildProxy())

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    )
  })
})
