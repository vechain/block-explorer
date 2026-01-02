import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from '.'
import { type IndexerGetContractsByMasterParams, indexerContractSchema, indexerResponseSchema } from './schemas'

const CONTRACTS_BY_MASTER_QUERY_KEY = 'getContractsByMaster'

export const contractsByMasterQueryOptions = (networkName: NetworkName, params: IndexerGetContractsByMasterParams) => ({
  queryKey: [CONTRACTS_BY_MASTER_QUERY_KEY, networkName, params],
  queryFn: () => getContractsByMaster({ networkName, params }),
  staleTime: 60 * 10000, // Contracts list is relatively static, consider fresh for 1 minute
  placeholderData: keepPreviousData, // Prevent UI flickering during pagination
})

const getContractsByMaster = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetContractsByMasterParams
}) => {
  const { master, ...restParams } = params

  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/contracts/by-master/${master}`,
    params: serializeZodParams(restParams),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerContractSchema),
    errorMessage: 'Invalid contracts by master response from VeWorld Indexer',
  })
}
