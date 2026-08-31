import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from '.'

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

const totalVetStakedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_VET_STAKED_QUERY_KEY, networkName],
  queryFn: () => getTotalVetStaked({ networkName }),
  refetchInterval: 5 * 1000,
})

const getTotalVetStaked = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await indexerFetch({
    networkName,
    endPoint: 'stargate/total-vet-staked',
  })
  return zodParse({
    data,
    schema: totalVetStakedSchema,
    errorMessage: 'Invalid total vet staked response from VeWorld Indexer',
  })
}

export const useTotalVetStaked = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    ...totalVetStakedQueryOptions(activeNetwork.name),
    enabled: activeNetwork.name !== NetworkName.SOLO,
  })
}

const totalVetStakedSchema = z.object({
  total: z.coerce.bigint(),
  byLevel: z.record(nftNameSchema, z.optional(z.coerce.bigint())),
  totalNftCount: z.number(),
})
