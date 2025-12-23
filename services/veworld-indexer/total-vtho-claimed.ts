import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

const TOTAL_VTHO_CLAIMED_QUERY_KEY = 'getTotalVthoClaimed'

export const totalVthoClaimedQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_VTHO_CLAIMED_QUERY_KEY, networkName],
  queryFn: () => getTotalVthoClaimed({ networkName }),
  refetchInterval: 5 * 1000,
})

const getTotalVthoClaimed = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({ baseUrl: resolveUrl(networkName), endPoint: '/stargate/total-vtho-claimed' })
  return zodParse({
    data,
    schema: totalVthoClaimedSchema,
    errorMessage: 'Invalid total vtho claimed response from VeWorld Indexer',
  })
}

const totalVthoClaimedSchema = z.coerce.bigint()
