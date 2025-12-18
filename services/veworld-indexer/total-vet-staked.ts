import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { nftNameSchema } from './nft-holders'

export const totalVetStakedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [getTotalVetStaked.name, networkName],
  queryFn: () => getTotalVetStaked({ networkName }),
  staleTime: 60 * 1000, // Consider data fresh for 60 seconds
  gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  refetchOnMount: false, // Don't refetch on mount if data exists
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
})
