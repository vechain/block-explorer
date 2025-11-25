import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

export type TotalVetStakedRange = '1-day' | '1-month' | '1-year'

export const totalVetStakedHistoricQueryOptions = (networkName: NetworkName, range: TotalVetStakedRange) => ({
  queryKey: [getTotalVetStakedHistoric.name, networkName, range],
  queryFn: () => getTotalVetStakedHistoric({ networkName, range }),
})

const getTotalVetStakedHistoric = async ({
  networkName,
  range,
}: {
  networkName: NetworkName
  range: TotalVetStakedRange
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/stargate/total-vet-staked/historic/${range}`,
  })
  return zodParse({
    data,
    schema: totalVetStakedHistoricSchema,
    errorMessage: 'Invalid total vet staked historic response from VeWorld Indexer',
  })
}

const totalVetStakedHistoricSchema = z.array(
  z.object({
    timestamp: z.number(),
    value: z.string(),
  }),
)
