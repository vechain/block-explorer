import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HexString } from '@/lib/schemas'
import { getDecodedSelector } from './selector-decoder'

const SELECTOR = '0xa9059cbb' as HexString
const FRAGMENT = { source: 'b32', abi: { type: 'function', name: 'transfer', inputs: [] } }

let fetchMock: ReturnType<typeof vi.fn>

const respondWith = (body: unknown, status: number) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))

describe('getDecodedSelector', () => {
  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns the fragment the route decoded', async () => {
    respondWith(FRAGMENT, 200)

    await expect(getDecodedSelector('function', SELECTOR)).resolves.toEqual(FRAGMENT)
    expect(String(fetchMock.mock.calls[0][0])).toContain(`hash=${SELECTOR}`)
  })

  it('reads a 404 as a definitive miss', async () => {
    respondWith({}, 404)

    await expect(getDecodedSelector('function', SELECTOR)).resolves.toBeNull()
  })

  // A miss is cached; an outage must not be, or it outlives itself.
  it('rejects rather than answering null when the route fails', async () => {
    respondWith({}, 502)

    await expect(getDecodedSelector('function', SELECTOR)).rejects.toThrow('decode/selector responded 502')
  })

  it('rejects when the request never lands', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(getDecodedSelector('function', SELECTOR)).rejects.toThrow('Failed to fetch')
  })
})
