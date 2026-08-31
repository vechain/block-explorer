import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { getResolvedAbi } from './sourcify'

// Deliberately not a bundled or curated address, so the lookup reaches Sourcify.
const ADDRESS = '0x1234567890123456789012345678901234567890' as AddressString
const ABI = [{ type: 'function', name: 'transfer', inputs: [], outputs: [] }]

const EMPTY_SLOT = `0x${''.padStart(64, '0')}`

let fetchMock: ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

const install = (sourcify: () => Response) => {
  fetchMock = vi.fn((url: string) =>
    Promise.resolve(String(url).includes('/storage/') ? json({ value: EMPTY_SLOT }) : sourcify()),
  )
  vi.stubGlobal('fetch', fetchMock)
}

const resolve = () => getResolvedAbi(NetworkName.MAINNET, ADDRESS)

describe('getResolvedAbi', () => {
  beforeEach(() => install(() => json({ abi: ABI, compilation: { name: 'Token' } })))
  afterEach(() => vi.unstubAllGlobals())

  it('returns the verified ABI under its compiled name', async () => {
    await expect(resolve()).resolves.toEqual({ abi: ABI, contractName: 'Token' })
  })

  it('reads an unverified contract as absent', async () => {
    install(() => json({}, 404))

    await expect(resolve()).resolves.toBeNull()
  })

  // A miss is kept for the session; an outage must not be, or it outlives itself.
  it('rejects rather than answering null when Sourcify fails', async () => {
    install(() => json({}, 502))

    await expect(resolve()).rejects.toThrow('sourcify responded 502')
  })

  it('never asks about a network Sourcify does not index', async () => {
    await expect(getResolvedAbi(NetworkName.SOLO, ADDRESS)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
