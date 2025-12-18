import { keepPreviousData } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { timestampSchema } from '@/lib/schemas/common'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

export enum TotalVetStakedRange {
  DAY = '1-day',
  MONTH = '1-month',
  YEAR = '1-year',
}

export const totalVetStakedHistoricQueryOptions = (networkName: NetworkName, range: TotalVetStakedRange) => ({
  queryKey: [getTotalVetStakedHistoric.name, networkName, range],
  queryFn: () => getTotalVetStakedHistoric({ networkName, range }),
  staleTime: 60 * 1000, // Consider data fresh for 60 seconds
  gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  refetchOnMount: false, // Don't refetch on mount if data exists
  placeholderData: keepPreviousData,
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
    timestamp: timestampSchema,
    value: z.string(),
  }),
)
