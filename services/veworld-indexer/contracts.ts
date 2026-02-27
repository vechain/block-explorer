import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { type AddressString } from '@/lib/schemas/common'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerContractSchema } from './schemas'

const CONTRACT_QUERY_KEY = 'getContract'

const contractQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [CONTRACT_QUERY_KEY, networkName, address],
  queryFn: () => getContract({ networkName, address }),
  staleTime: Infinity,
  placeholderData: keepPreviousData,
})

export const useContract = ({ address }: { address: AddressString }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(contractQueryOptions(activeNetwork.name, address))
}

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
