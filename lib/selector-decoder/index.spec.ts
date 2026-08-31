import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { decodeSelector } from './index'

const SELECTOR = '0xa9059cbb'
const OTHER_SELECTOR = '0x23b872dd'
const FRAGMENT = { type: 'function', name: 'transfer', inputs: [], outputs: [] }

let fetchMock: ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const openchainHit = (signatures: Record<string, string>) =>
  json({
    ok: true,
    result: { function: Object.fromEntries(Object.entries(signatures).map(([k, v]) => [k, [{ name: v }]])) },
  })

const install = (respond: (url: string) => Response | Promise<Response>) => {
  fetchMock = vi.fn((url: string) => Promise.resolve(respond(String(url))))
  vi.stubGlobal('fetch', fetchMock)
}

const openchainCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('openchain'))

describe('decodeSelector', () => {
  beforeEach(() => install(url => (url.includes('openchain') ? openchainHit({}) : json([FRAGMENT]))))
  afterEach(() => vi.unstubAllGlobals())

  it('prefers the b32 fragment over an OpenChain signature', async () => {
    await expect(decodeSelector('function', SELECTOR)).resolves.toEqual({ source: 'b32', abi: FRAGMENT })
  })

  it('falls back to the OpenChain signature when b32 has no entry', async () => {
    install(url =>
      url.includes('openchain') ? openchainHit({ [SELECTOR]: 'transfer(address,uint256)' }) : json({}, 404),
    )

    await expect(decodeSelector('function', SELECTOR)).resolves.toEqual({
      source: 'openchain',
      signature: 'transfer(address,uint256)',
    })
  })

  it('reads a miss on both sources as a definitive miss', async () => {
    install(url => (url.includes('openchain') ? openchainHit({}) : json({}, 404)))

    await expect(decodeSelector('function', SELECTOR)).resolves.toBeNull()
  })

  // A miss is cached forever by the caller; an outage must never reach it as one.
  it('rejects when neither source answered', async () => {
    install(url => (url.includes('openchain') ? json({}, 503) : json({}, 502)))

    await expect(decodeSelector('function', SELECTOR)).rejects.toThrow('b32 responded 502')
  })

  it('never asks either source about a hash the kind cannot have', async () => {
    await expect(decodeSelector('event', SELECTOR)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Phase 0 measured this as the difference between 6.7 and 0.015 upstream requests
  // per second: without it a transaction page is one OpenChain call per selector.
  it('collapses selectors decoded in the same tick into one OpenChain call', async () => {
    install(url =>
      url.includes('openchain')
        ? openchainHit({ [SELECTOR]: 'transfer(address,uint256)', [OTHER_SELECTOR]: 'transferFrom()' })
        : json({}, 404),
    )

    await Promise.all([decodeSelector('function', SELECTOR), decodeSelector('function', OTHER_SELECTOR)])

    expect(openchainCalls()).toHaveLength(1)
    expect(String(openchainCalls()[0][0])).toContain(`${SELECTOR}%2C${OTHER_SELECTOR}`)
  })
})
