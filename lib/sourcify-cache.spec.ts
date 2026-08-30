import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCachedProxy } from '@/lib/cached-proxy'
import { sourcifyEndpoint } from './sourcify-cache'

const ADDRESS = '0x5ef79995fe8a89e0812330e4378eb2660cede699'
const ABI = [{ type: 'function', name: 'transfer', inputs: [], outputs: [] }]
const QUERY = `chainId=100009&address=${ADDRESS}`

let fetchMock: ReturnType<typeof vi.fn>

const buildProxy = () => createCachedProxy({ name: 'sourcify', endpoints: { '': sourcifyEndpoint } })

const send = (proxy: ReturnType<typeof buildProxy>, query = QUERY) =>
  proxy.handle(new NextRequest(new URL(`http://localhost/api/sourcify?${query}`)))

const verified = () => new Response(JSON.stringify({ abi: ABI, compilation: { name: 'B3TR' } }), { status: 200 })
const unverified = () => new Response('{}', { status: 404 })

describe('sourcifyEndpoint', () => {
  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(verified()))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('serves a verified contract from cache on the second request', async () => {
    const proxy = buildProxy()

    const first = await send(proxy)
    await send(proxy)

    await expect(first.json()).resolves.toMatchObject({ abi: ABI, contractName: 'B3TR' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps an unverified contract out of Sourcify on the second request', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(unverified()))
    const proxy = buildProxy()

    const first = await send(proxy)
    const second = await send(proxy)

    expect([first.status, second.status]).toEqual([404, 404])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lets a hit outlive a miss, since only verification can turn one into the other', async () => {
    const hit = await send(buildProxy())

    fetchMock.mockImplementation(() => Promise.resolve(unverified()))
    const miss = await send(buildProxy())

    expect(hit.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
    expect(miss.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=3600, stale-while-revalidate=604800')
  })
})
