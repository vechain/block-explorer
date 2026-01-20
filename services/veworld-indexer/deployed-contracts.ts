import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerContractSchema, indexerResponseSchema } from './schemas'

const DEPLOYED_CONTRACTS_QUERY_KEY = 'getContractsByMaster'

export const deployedContractsQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [DEPLOYED_CONTRACTS_QUERY_KEY, networkName, address],
  queryFn: () => getContractsByMaster({ networkName, address }),
})

const getContractsByMaster = async ({ networkName, address }: { networkName: NetworkName; address: AddressString }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/contracts/by-master/${address}`,
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
