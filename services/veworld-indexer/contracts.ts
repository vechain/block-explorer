import { queryOptions, useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { type AddressString } from '@/lib/schemas/common'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetchOrNull } from '.'
import { indexerContractSchema } from './schemas'

const CONTRACT_QUERY_KEY = 'getContract'

// Matches the proxy's negative cache, so a retry past it actually reaches the indexer.
const UNINDEXED_CONTRACT_STALE_MS = 2 * 60 * 1000

const contractQueryOptions = (networkName: NetworkName, address: AddressString) =>
  queryOptions({
    queryKey: [CONTRACT_QUERY_KEY, networkName, address],
    queryFn: () => getContract({ networkName, address }),
    // A contract record never changes; only an absent one is worth asking about again,
    // the indexer being free to catch up on a deployment it has yet to see.
    staleTime: query => (query.state.data ? Infinity : UNINDEXED_CONTRACT_STALE_MS),
  })

export const useContract = ({ address, enabled = true }: { address: AddressString; enabled?: boolean }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({ ...contractQueryOptions(activeNetwork.name, address), enabled })
}

const getContract = async ({ networkName, address }: { networkName: NetworkName; address: AddressString }) => {
  const data = await indexerFetchOrNull({
    networkName,
    endPoint: `/contracts/${address}`,
  })

  if (data === null) return null

  return zodParse({
    data,
    schema: indexerContractSchema,
    errorMessage: 'Invalid contract response from VeWorld Indexer',
  })
}
