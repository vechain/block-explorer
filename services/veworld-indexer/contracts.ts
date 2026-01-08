import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from '.'
import { type IndexerGetContractsByMasterParams, indexerContractSchema, indexerResponseSchema } from './schemas'
import { AddressString } from '@/lib/schemas/common'

const CONTRACTS_BY_MASTER_QUERY_KEY = 'getContractsByMaster'

export const contractsByMasterQueryOptions = (networkName: NetworkName, params: IndexerGetContractsByMasterParams) => ({
  queryKey: [CONTRACTS_BY_MASTER_QUERY_KEY, networkName, params],
  queryFn: () => getContractsByMaster({ networkName, params }),
  staleTime: 60 * 10000, // 10 minutes
  placeholderData: keepPreviousData,
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

const CONTRACT_QUERY_KEY = 'getContract'

export const contractQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [CONTRACT_QUERY_KEY, networkName, address],
  queryFn: () => getContract({ networkName, address }),
  staleTime: Infinity,
  placeholderData: keepPreviousData,
})

const getContract = async ({ networkName, address }: { networkName: NetworkName; address: AddressString }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/contracts/${address}`,
  })

  return zodParse({
    data,
    schema: indexerContractSchema,
    errorMessage: 'Invalid contract response from VeWorld Indexer',
  })
}
