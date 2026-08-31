'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { Abi } from 'viem'
import type { NetworkName } from '@/lib/constants/network'
import { getKnownContractAbi, getKnownContractName, isBuiltinAddress } from '@/lib/known-contracts'
import { isProxiedNetwork } from '@/lib/proxied-network'
import type { AddressString } from '@/lib/schemas'
import { fetchSourcifyAbi } from '@/lib/sourcify'
import { useSettingsStore } from '@/lib/stores/settings'

interface ResolvedAbi {
  abi: Abi
  // Display name: built-in name > curated name > Sourcify contractName > null.
  contractName: string | null
}

const fetchResolvedAbi = async (networkName: NetworkName, address: AddressString): Promise<ResolvedAbi | null> => {
  const normalised = address.toLowerCase() as AddressString
  const knownAbi = getKnownContractAbi(networkName, normalised)
  if (knownAbi && knownAbi.length > 0) {
    return { abi: knownAbi, contractName: getKnownContractName(networkName, normalised) }
  }

  // Sourcify has neither the non-CA built-in addresses nor any notion of solo.
  if (!isProxiedNetwork(networkName) || isBuiltinAddress(normalised)) return null

  const hit = await fetchSourcifyAbi(networkName, normalised)
  if (!hit) return null

  return {
    abi: hit.abi,
    contractName: getKnownContractName(networkName, normalised) ?? hit.contractName ?? null,
  }
}

const RESOLVED_ABI_QUERY_KEY = 'getResolvedAbi'

// Sourcify sends no Cache-Control, so this cache is the only one there is.
const GC_TIME_MS = 60 * 60 * 1_000

const resolvedAbiQueryOptions = (networkName: NetworkName, address: AddressString | null | undefined) =>
  queryOptions({
    queryKey: [RESOLVED_ABI_QUERY_KEY, networkName, address?.toLowerCase()],
    queryFn: address ? () => fetchResolvedAbi(networkName, address) : skipToken,
    staleTime: Infinity,
    gcTime: GC_TIME_MS,
  })

export const useResolvedAbi = (address: AddressString | null | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(resolvedAbiQueryOptions(networkName ?? activeNetworkName, address))
}

// Callable inside another queryFn (revert decoding), where hooks are not available.
export { fetchResolvedAbi as getResolvedAbi }
