import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

export const totalVetStakedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [getTotalVetStaked.name, networkName],
  queryFn: () => getTotalVetStaked({ networkName }),
  refetchInterval: 5 * 1000,
})

const getTotalVetStaked = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({ baseUrl: resolveUrl(networkName), endPoint: '/stargate/total-vet-staked' })
  return zodParse(data, totalVetStakedSchema, 'Invalid total vet staked response from VeWorld Indexer')
}

const totalVetStakedSchema = z.object({
  total: z.coerce.bigint(),
  byLevel: z.record(nftNameSchema, z.coerce.bigint()),
})
