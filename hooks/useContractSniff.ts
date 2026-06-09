'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { Address } from '@vechain/sdk-core'
import type { NetworkName } from '@/lib/constants/network'
import { sniffStandard } from '@/lib/contract-sniff'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

const CONTRACT_SNIFF_QUERY_KEY = 'getContractSniff'

const fetchContractSniff = async (networkName: NetworkName, address: AddressString) => {
  const thorClient = getThorClient(networkName)
  const bytecode = await thorClient.accounts.getBytecode(Address.of(address))
  return sniffStandard(bytecode.toString())
}

const contractSniffQueryOptions = (networkName: NetworkName, address: AddressString | null | undefined) =>
  queryOptions({
    queryKey: [CONTRACT_SNIFF_QUERY_KEY, networkName, address?.toLowerCase()],
    queryFn: address ? () => fetchContractSniff(networkName, address) : skipToken,
    staleTime: Infinity,
  })

export const useContractSniff = (address: AddressString | null | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(contractSniffQueryOptions(networkName ?? activeNetworkName, address))
}
