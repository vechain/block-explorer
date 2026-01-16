import { useQuery } from '@tanstack/react-query'
import z from 'zod'
import { IPFS_GATEWAY_PROXY_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { zodParse } from '@/lib/utils/zod'

const NFT_METADATA_QUERY_KEY = 'getNftMetadata'

const getNftMetadata = async (uri: string) => {
  const { data } = await apiClient.get({
    baseUrl: '/api',
    endPoint: `/nft-metadata`,
    params: { uri: encodeURIComponent(uri) },
  })

  return zodParse({
    data,
    schema: nftMetadataSchema,
    errorMessage: `Invalid NFT metadata at URI: ${uri}`,
  })
}

const nftMetadataQueryOptions = (uri: string) => ({
  queryKey: [NFT_METADATA_QUERY_KEY, uri],
  queryFn: () => getNftMetadata(uri),
  staleTime: Infinity,
})

export const useNftMetadata = (uri: string) => {
  const parsedUri = zodParse({
    data: uri,
    schema: nftMetadataUriSchema,
    errorMessage: 'Invalid NFT metadata URI',
    fallbackData: null,
  })

  return useQuery({ ...nftMetadataQueryOptions(parsedUri), enabled: !!parsedUri })
}

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
