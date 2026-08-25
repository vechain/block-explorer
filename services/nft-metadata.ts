import { useQuery } from '@tanstack/react-query'
import z from 'zod'
import { IPFS_GATEWAY_PROXY_URL } from '@/env.public'
import { zodParse } from '@/lib/utils/zod'

const NFT_METADATA_QUERY_KEY = 'getNftMetadata'

const REQUEST_TIMEOUT_MS = 10_000

// A token URI is chosen by whoever minted the NFT and may name a file of any size.
// Metadata documents run to a few KB, and React Query holds them for the life of the
// tab, so an unbounded body would sit in memory rather than merely arriving slowly.
const MAX_RESPONSE_BYTES = 256 * 1024

// ****************************** IPFS URI schema ******************************

export const parseNftMetadataUri = (uri: string) => {
  const ipfsUriResult = nftMetadataUriSchema.safeParse(uri)
  if (ipfsUriResult.success) {
    return ipfsUriResult.data
  }
  return uri
}

const nftMetadataUriSchema = z
  .url()
  .transform(url => url.replace('ipfs://', `${IPFS_GATEWAY_PROXY_URL}/ipfs/`).replace('ar://', 'https://arweave.net/'))

// ****************************** Fetching ******************************

// Streamed rather than buffered, so an oversize body is abandoned mid-download instead
// of being read in full. The declared length is only a shortcut — hosts may omit it.
const readCapped = async (response: Response) => {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    throw new Error('NFT metadata exceeds the size limit')
  }

  const reader = response.body?.getReader()
  if (!reader) return ''

  const chunks: Uint8Array[] = []
  let size = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    size += value.byteLength
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel().catch(() => {})
      throw new Error('NFT metadata exceeds the size limit')
    }
    chunks.push(value)
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(body)
}

/**
 * Fetched from the browser rather than through the server. The gateways send CORS
 * headers, and dereferencing a mint-controlled URI server-side would make the app an
 * open proxy for anything its container can reach.
 */
export const fetchNftJson = async (uri: string): Promise<unknown> => {
  // Sent without custom headers, which would force a preflight static hosts often fail.
  const response = await fetch(parseNftMetadataUri(uri), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`NFT metadata request failed with ${response.status}`)

  return JSON.parse(await readCapped(response))
}

const getNftMetadata = async (uri: string) =>
  zodParse({
    data: await fetchNftJson(uri),
    schema: nftMetadataSchema,
    errorMessage: `Invalid NFT metadata at URI: ${uri}`,
  })

const nftMetadataQueryOptions = (uri: string) => ({
  queryKey: [NFT_METADATA_QUERY_KEY, uri],
  queryFn: () => getNftMetadata(uri),
  staleTime: Infinity,
})

export const useNftMetadata = (uri: string) => useQuery({ ...nftMetadataQueryOptions(uri), enabled: !!uri })

// ****************************** NFT Metadata schema ******************************
const nftAttributeSchema = z
  .object({
    trait_type: z.string(),
    value: z.any(),
  })
  .transform(data => ({
    traitType: data.trait_type,
    value: data.value,
  }))

const nftMetadataSchema = z
  .object({
    description: z.string().default(''),
    external_url: z.string().default(''),
    image: z.string().default(''),
    name: z.string().default(''),
    attributes: z.array(nftAttributeSchema).default([]),
  })
  .transform(data => ({
    description: data.description,
    externalUrl: data.external_url,
    image: data.image,
    name: data.name,
    attributes: data.attributes,
  }))

export type NftMetadata = z.infer<typeof nftMetadataSchema>
