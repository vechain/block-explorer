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

const nftHoldersSchema = z.object({
  total: z.number(),
  byLevel: z.object({
    Dawn: z.number(),
    Strength: z.number(),
    ThunderX: z.number(),
    Flash: z.number(),
    VeThorX: z.number(),
    Lightning: z.number(),
    StrengthX: z.number(),
    MjolnirX: z.number(),
    Mjolnir: z.number(),
    Thunder: z.number(),
  }),
})
