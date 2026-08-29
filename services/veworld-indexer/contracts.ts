import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { type AddressString } from '@/lib/schemas/common'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerCachedGet } from '.'
import { indexerContractSchema } from './schemas'

const CONTRACT_QUERY_KEY = 'getContract'

const contractQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [CONTRACT_QUERY_KEY, networkName, address],
  queryFn: () => getContract({ networkName, address }),
  staleTime: Infinity,
})

export const useContract = ({ address, enabled = true }: { address: AddressString; enabled?: boolean }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({ ...contractQueryOptions(activeNetwork.name, address), enabled })
}

const getContract = async ({ networkName, address }: { networkName: NetworkName; address: AddressString }) => {
  const { data } = await indexerCachedGet({
    networkName,
    endPoint: 'contracts/details',
    params: { address },
    direct: { endPoint: `/contracts/${address}`, params: {} },
  })

  return zodParse({
    data,
    schema: indexerContractSchema,
    errorMessage: 'Invalid contract response from VeWorld Indexer',
  })
}
