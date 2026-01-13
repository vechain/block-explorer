import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

const nftNameSchema = z.enum([
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

const TOTAL_VET_STAKED_QUERY_KEY = 'getTotalVetStaked'

export const totalVetStakedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_VET_STAKED_QUERY_KEY, networkName],
  queryFn: () => getTotalVetStaked({ networkName }),
  refetchInterval: 5 * 1000,
})

const getTotalVetStaked = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/stargate/total-vet-staked',
  })
  return zodParse({
    data,
    schema: totalVetStakedSchema,
    errorMessage: 'Invalid total vet staked response from VeWorld Indexer',
  })
}

const totalVetStakedSchema = z.object({
  total: z.coerce.bigint(),
  byLevel: z.record(nftNameSchema, z.coerce.bigint()),
  totalNftCount: z.number(),
})
