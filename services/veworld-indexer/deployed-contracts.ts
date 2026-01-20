import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from '.'
import { indexerContractSchema, indexerResponseSchema } from './schemas'

const DEPLOYED_CONTRACTS_QUERY_KEY = 'getContractsByMaster'

export interface DeployedContractsParams {
  master: AddressString
  page?: number
  size?: number
}

export const deployedContractsQueryOptions = (networkName: NetworkName, params: DeployedContractsParams) => ({
  queryKey: [DEPLOYED_CONTRACTS_QUERY_KEY, networkName, params],
  queryFn: () => getContractsByMaster({ networkName, params }),
  placeholderData: keepPreviousData,
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchInterval: 2 * 60_000,
  refetchOnWindowFocus: true,
})

const serializeParams = (params: DeployedContractsParams): Record<string, string> => {
  const serialized: Record<string, string> = { master: params.master }
  if (params.page !== undefined) serialized.page = String(params.page)
  if (params.size !== undefined) serialized.size = String(params.size)
  return serialized
}

const getContractsByMaster = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: DeployedContractsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/contracts',
    params: serializeParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerContractSchema),
    errorMessage: 'Invalid deployed contracts response from VeWorld Indexer',
    fallbackData: {
      data: [],
      pagination: { hasNext: false },
    },
  })
}
