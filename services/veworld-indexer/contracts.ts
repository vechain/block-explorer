import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from '.'
import { indexerContractSchema } from './schemas'
import { AddressString } from '@/lib/schemas/common'

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
