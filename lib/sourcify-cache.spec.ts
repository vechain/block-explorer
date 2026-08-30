import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCachedProxy } from '@/lib/cached-proxy'
import { sourcifyEndpoint } from './sourcify-cache'

const ADDRESS = '0x5ef79995fe8a89e0812330e4378eb2660cede699'
const IMPLEMENTATION = '0x76ca782b59c74d088c7d2cce2f211bc00836c602'
const ABI = [{ type: 'function', name: 'transfer', inputs: [], outputs: [] }]
const QUERY = `network=mainnet&address=${ADDRESS}`

const EMPTY_SLOT = `0x${''.padStart(64, '0')}`
const IMPL_SLOT = `0x${IMPLEMENTATION.slice(2).padStart(64, '0')}`

let fetchMock: ReturnType<typeof vi.fn>

const buildProxy = () => createCachedProxy({ name: 'sourcify', endpoints: { '': sourcifyEndpoint } })

const send = (proxy: ReturnType<typeof buildProxy>, query = QUERY) =>
  proxy.handle(new NextRequest(new URL(`http://localhost/api/sourcify?${query}`)))

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const verified = (name: string) => json({ abi: ABI, compilation: { name } })
const unverified = () => json({}, 404)

// The endpoint reads a storage slot from the node before asking Sourcify, so a
// stub has to answer as both.
const stub = ({ slot = EMPTY_SLOT, sourcify = () => verified('B3TR') } = {}) =>
  vi.fn((url: string) => Promise.resolve(String(url).includes('/storage/') ? json({ value: slot }) : sourcify()))

const sourcifyCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/v2/contract/'))

describe('sourcifyEndpoint', () => {
  beforeEach(() => {
    fetchMock = stub()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('serves a verified contract from cache on the second request', async () => {
    const proxy = buildProxy()

    const first = await send(proxy)
    await send(proxy)

    await expect(first.json()).resolves.toMatchObject({ abi: ABI, contractName: 'B3TR' })
    expect(sourcifyCalls()).toHaveLength(1)
  })

  it('answers a proxy with the implementation ABI', async () => {
    fetchMock = stub({
      slot: IMPL_SLOT,
      sourcify: () => verified('Implementation'),
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await send(buildProxy())

    await expect(response.json()).resolves.toMatchObject({ contractName: 'Implementation' })
    expect(String(sourcifyCalls()[0][0])).toContain(IMPLEMENTATION)
  })

  it('falls back to the proxy itself when the implementation is unverified', async () => {
    const seen: string[] = []
    fetchMock = vi.fn((url: string) => {
      const target = String(url)
      if (target.includes('/storage/')) return Promise.resolve(json({ value: IMPL_SLOT }))
      seen.push(target)
      return Promise.resolve(target.includes(IMPLEMENTATION) ? unverified() : verified('B3TR'))
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await send(buildProxy())

    await expect(response.json()).resolves.toMatchObject({ contractName: 'B3TR' })
    expect(seen).toHaveLength(2)
  })

  it('still answers from the address itself when the slot cannot be read', async () => {
    fetchMock = vi.fn((url: string) =>
      String(url).includes('/storage/') ? Promise.reject(new Error('node down')) : Promise.resolve(verified('B3TR')),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await send(buildProxy())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ contractName: 'B3TR' })
  })

  // A cached "not verified" claims the implementation isn't either, which an unread
  // slot cannot support — and the negative cache is shared across every viewer.
  it('refuses to call an address unverified when the slot went unread', async () => {
    fetchMock = vi.fn((url: string) =>
      String(url).includes('/storage/') ? Promise.reject(new Error('node down')) : Promise.resolve(unverified()),
    )
    vi.stubGlobal('fetch', fetchMock)
    const proxy = buildProxy()

    const first = await send(proxy)
    await send(proxy)

    expect(first.status).toBe(502)
    expect(first.headers.get('Cache-Control')).toBe('no-store')
    expect(sourcifyCalls()).toHaveLength(2)
  })

  it('gives a followed proxy a hit no longer than a miss, since an upgrade moves the slot', async () => {
    fetchMock = stub({ slot: IMPL_SLOT, sourcify: () => verified('Implementation') })
    vi.stubGlobal('fetch', fetchMock)

    const proxied = await send(buildProxy())

    expect(proxied.headers.get('Cache-Control')).toBe(
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=604800',
    )
  })

  it('keeps an unverified contract out of Sourcify and off the node on the second request', async () => {
    fetchMock = stub({ sourcify: unverified })
    vi.stubGlobal('fetch', fetchMock)
    const proxy = buildProxy()

    const first = await send(proxy)
    const second = await send(proxy)

    expect([first.status, second.status]).toEqual([404, 404])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('lets a hit outlive a miss, since only verification can turn one into the other', async () => {
    const hit = await send(buildProxy())

    fetchMock = stub({ sourcify: unverified })
    vi.stubGlobal('fetch', fetchMock)
    const miss = await send(buildProxy())

    expect(hit.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
    expect(miss.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=3600, stale-while-revalidate=604800')
  })

  it('rejects a network it cannot reach server-side', async () => {
    const response = await send(buildProxy(), `network=solo&address=${ADDRESS}`)

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
