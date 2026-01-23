import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

const TOTAL_VET_DELEGATED_QUERY_KEY = 'getTotalVetDelegated'

export const totalVetDelegatedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_VET_DELEGATED_QUERY_KEY, networkName],
  queryFn: () => getTotalVetDelegated({ networkName }),
  refetchInterval: 60 * 1000,
})

const getTotalVetDelegated = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/stargate/total-vet-delegated',
    headers: {
      accept: '*/*',
      'X-Project-Id': 'stargate',
    },
  })

  return zodParse({
    data,
    schema: totalVetDelegatedSchema,
    errorMessage: 'Invalid total vet delegated response from VeWorld Indexer',
  })
}

const totalVetDelegatedSchema = z.object({
  blockId: z.string(),
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  total: z.coerce.bigint(),
  byLevel: z.record(z.string(), z.coerce.bigint()).default({}),
  totalNftCount: z.number(),
  nftCountByLevel: z.record(z.string(), z.number()).default({}),
})
