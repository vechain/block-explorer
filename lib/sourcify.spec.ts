import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { fetchSourcifyAbi } from './sourcify'

const ADDRESS = '0x5ef79995fe8a89e0812330e4378eb2660cede699'
const IMPLEMENTATION = '0x76ca782b59c74d088c7d2cce2f211bc00836c602'
const ABI = [{ type: 'function', name: 'transfer', inputs: [], outputs: [] }]

const EMPTY_SLOT = `0x${''.padStart(64, '0')}`
const IMPL_SLOT = `0x${IMPLEMENTATION.slice(2).padStart(64, '0')}`

let fetchMock: ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const verified = (name: string) => json({ abi: ABI, compilation: { name } })
const unverified = () => json({}, 404)

// The lookup reads a storage slot from the node before asking Sourcify, so a stub has
// to answer as both.
const install = ({ slot = EMPTY_SLOT, sourcify = () => verified('B3TR') } = {}) => {
  fetchMock = vi.fn((url: string) =>
    Promise.resolve(String(url).includes('/storage/') ? json({ value: slot }) : sourcify()),
  )
  vi.stubGlobal('fetch', fetchMock)
}

const sourcifyCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/v2/contract/'))

const resolve = () => fetchSourcifyAbi(NetworkName.MAINNET, ADDRESS)

describe('fetchSourcifyAbi', () => {
  beforeEach(() => install())
  afterEach(() => vi.unstubAllGlobals())

  it('answers a plain contract from its own address', async () => {
    await expect(resolve()).resolves.toMatchObject({ abi: ABI, contractName: 'B3TR' })
    expect(String(sourcifyCalls()[0][0])).toContain(ADDRESS)
  })

  it('answers a proxy with the implementation ABI', async () => {
    install({ slot: IMPL_SLOT, sourcify: () => verified('Implementation') })

    await expect(resolve()).resolves.toMatchObject({ contractName: 'Implementation' })
    expect(String(sourcifyCalls()[0][0])).toContain(IMPLEMENTATION)
  })

  it('falls back to the proxy itself when the implementation is unverified', async () => {
    fetchMock = vi.fn((url: string) => {
      const target = String(url)
      if (target.includes('/storage/')) return Promise.resolve(json({ value: IMPL_SLOT }))
      return Promise.resolve(target.includes(IMPLEMENTATION) ? unverified() : verified('B3TR'))
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolve()).resolves.toMatchObject({ contractName: 'B3TR' })
    expect(sourcifyCalls()).toHaveLength(2)
  })

  it('still answers from the address itself when the slot cannot be read', async () => {
    fetchMock = vi.fn((url: string) =>
      String(url).includes('/storage/') ? Promise.reject(new Error('node down')) : Promise.resolve(verified('B3TR')),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolve()).resolves.toMatchObject({ contractName: 'B3TR' })
  })

  it('reads an unverified contract with a readable slot as a definitive miss', async () => {
    install({ sourcify: unverified })

    await expect(resolve()).resolves.toBeNull()
  })

  // The caller keeps a miss for the session, and an unread slot cannot support the claim
  // that the implementation is unverified either.
  it('refuses to call an address unverified when the slot went unread', async () => {
    fetchMock = vi.fn((url: string) =>
      String(url).includes('/storage/') ? Promise.reject(new Error('node down')) : Promise.resolve(unverified()),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolve()).rejects.toThrow('thor responded 502')
  })

  it('surfaces a Sourcify outage rather than reporting an unverified contract', async () => {
    install({ sourcify: () => json({}, 503) })

    await expect(resolve()).rejects.toThrow('sourcify responded 503')
  })
})
