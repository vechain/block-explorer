import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNftJson, parseNftMetadataUri } from './nft-metadata'

// Matches NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL in vitest.config.ts.
const IPFS_GATEWAY = 'https://ipfs.test'
const CID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'

const MAX_RESPONSE_BYTES = 256 * 1024
const CHUNK_BYTES = 64 * 1024

const jsonBody = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

/** A body produced only as it is read, so the test can see how much was pulled. */
const lazyStream = (totalBytes: number) => {
  let produced = 0
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (produced >= totalBytes) return controller.close()
      produced += CHUNK_BYTES
      controller.enqueue(new Uint8Array(CHUNK_BYTES))
    },
    cancel() {
      cancelled = true
    },
  })

  return { stream, produced: () => produced, cancelled: () => cancelled }
}

const requestedUrl = (fetchMock: ReturnType<typeof vi.fn>) => String(fetchMock.mock.calls[0][0])

describe('parseNftMetadataUri', () => {
  it('rewrites an ipfs URI to the gateway', () => {
    expect(parseNftMetadataUri(`ipfs://${CID}/1.json`)).toBe(`${IPFS_GATEWAY}/ipfs/${CID}/1.json`)
  })

  it('rewrites an ar URI to arweave', () => {
    expect(parseNftMetadataUri('ar://abc123')).toBe('https://arweave.net/abc123')
  })

  it('leaves an https URI alone', () => {
    expect(parseNftMetadataUri('https://example.com/1.json')).toBe('https://example.com/1.json')
  })
})

describe('fetchNftJson', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonBody({ name: 'Token' }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('resolution', () => {
    it('fetches an ipfs URI from the gateway', async () => {
      await expect(fetchNftJson(`ipfs://${CID}/1.json`)).resolves.toEqual({ name: 'Token' })

      expect(requestedUrl(fetchMock)).toBe(`${IPFS_GATEWAY}/ipfs/${CID}/1.json`)
    })

    it('fetches an ar URI from arweave', async () => {
      await fetchNftJson('ar://abc123')

      expect(requestedUrl(fetchMock)).toBe('https://arweave.net/abc123')
    })

    it('fetches an https URI directly', async () => {
      await fetchNftJson('https://example.com/1.json')

      expect(requestedUrl(fetchMock)).toBe('https://example.com/1.json')
    })

    it('sends no custom headers, which would force a preflight', async () => {
      await fetchNftJson('https://example.com/1.json')

      expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('headers')
    })

    it('applies a request timeout', async () => {
      await fetchNftJson('https://example.com/1.json')

      expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('size guard', () => {
    it('abandons a huge body mid-download instead of buffering it', async () => {
      const source = lazyStream(10 * 1024 ** 3)
      fetchMock.mockResolvedValue(new Response(source.stream, { status: 200 }))

      await expect(fetchNftJson('https://example.com/huge.json')).rejects.toThrow(/size limit/)

      expect(source.cancelled()).toBe(true)
      // The body offered 10GB; only a bounded prefix may ever have been pulled.
      expect(source.produced()).toBeLessThan(5 * 1024 * 1024)
    })

    it('rejects a declared oversize length without reading the body', async () => {
      const source = lazyStream(10 * 1024 ** 3)
      const response = new Response(source.stream, {
        status: 200,
        headers: { 'content-length': String(10 * 1024 ** 3) },
      })
      fetchMock.mockResolvedValue(response)

      await expect(fetchNftJson('https://example.com/huge.json')).rejects.toThrow(/size limit/)

      // Never took a reader, so the body was not read at all.
      expect(response.bodyUsed).toBe(false)
      expect(response.body?.locked).toBe(false)
      // A ReadableStream prefills one chunk to its high-water mark on its own.
      expect(source.produced()).toBeLessThanOrEqual(CHUNK_BYTES)
    })

    it('accepts a body just inside the cap', async () => {
      const padding = 'x'.repeat(MAX_RESPONSE_BYTES - 64)
      fetchMock.mockResolvedValue(jsonBody({ name: padding.slice(0, 1000) }))

      await expect(fetchNftJson('https://example.com/1.json')).resolves.toHaveProperty('name')
    })
  })

  describe('failures', () => {
    it('throws on a non-ok response', async () => {
      fetchMock.mockResolvedValue(new Response('nope', { status: 404 }))

      await expect(fetchNftJson('https://example.com/1.json')).rejects.toThrow(/404/)
    })

    it('throws when the body is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>not json</html>', { status: 200 }))

      await expect(fetchNftJson('https://example.com/1.json')).rejects.toThrow()
    })
  })
})
