import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { getResolvedAbi } from './sourcify'

// Deliberately not a bundled or curated address, so the lookup reaches the route.
const ADDRESS = '0x1234567890123456789012345678901234567890' as AddressString
const ABI = [{ type: 'function', name: 'transfer', inputs: [], outputs: [] }]

let fetchMock: ReturnType<typeof vi.fn>

const respondWith = (body: unknown, status: number) =>
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))

const resolve = () => getResolvedAbi(NetworkName.MAINNET, ADDRESS)

describe('getResolvedAbi', () => {
  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns the ABI the route resolved', async () => {
    respondWith({ abi: ABI, contractName: 'Token' }, 200)

    await expect(resolve()).resolves.toEqual({ abi: ABI, contractName: 'Token' })
  })

  it('reads a 404 as unverified', async () => {
    respondWith({}, 404)

    await expect(resolve()).resolves.toBeNull()
  })

  // A miss is cached; an outage must not be, or it outlives itself.
  it('rejects rather than answering null when the route fails', async () => {
    respondWith({}, 502)

    await expect(resolve()).rejects.toThrow('sourcify responded 502')
  })

  it('never asks about a network the route cannot reach', async () => {
    await expect(getResolvedAbi(NetworkName.SOLO, ADDRESS)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
