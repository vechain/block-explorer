import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

export const nftHoldersQueryOptions = (networkName: NetworkName) => ({
  queryKey: [getNftHolders.name, networkName],
  queryFn: () => getNftHolders({ networkName }),
  refetchInterval: 5 * 1000,
})

const getNftHolders = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({ baseUrl: resolveUrl(networkName), endPoint: '/stargate/nft-holders' })

  return zodParse(data, nftHoldersSchema, 'Invalid nft holders response from VeWorld Indexer')
}

export const nftNameSchema = z.enum([
  'Dawn',
  'Strength',
  'ThunderX',
  'Flash',
  'VeThorX',
  'Lightning',
  'StrengthX',
  'MjolnirX',
  'Mjolnir',
  'Thunder',
])

const nftHoldersSchema = z.object({
  total: z.number(),
  byLevel: z.record(nftNameSchema, z.number()),
})
