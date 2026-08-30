'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { Abi } from 'viem'
import type { NetworkName } from '@/lib/constants/network'
import { getKnownContractAbi, getKnownContractName, isBuiltinAddress } from '@/lib/known-contracts'
import { isProxiedNetwork } from '@/lib/proxied-network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'

interface ResolvedAbi {
  abi: Abi
  // Display name: built-in name > curated name > Sourcify contractName > null.
  contractName: string | null
}

// The route follows EIP-1967 proxies itself, so this is one request and no chain read.
const fetchSourcify = async (networkName: NetworkName, address: AddressString) => {
  try {
    const response = await fetch(`/api/sourcify?network=${networkName}&address=${address}`)
    if (!response.ok) return null
    const body = (await response.json()) as { abi: Abi; contractName?: string }
    if (!body?.abi || !Array.isArray(body.abi)) return null
    return body
  } catch {
    return null
  }
}

const fetchResolvedAbi = async (networkName: NetworkName, address: AddressString): Promise<ResolvedAbi | null> => {
  const normalised = address.toLowerCase() as AddressString
  const knownAbi = getKnownContractAbi(networkName, normalised)
  if (knownAbi && knownAbi.length > 0) {
    return { abi: knownAbi, contractName: getKnownContractName(networkName, normalised) }
  }

  // Sourcify has neither the non-CA built-in addresses nor any notion of solo.
  if (!isProxiedNetwork(networkName) || isBuiltinAddress(normalised)) return null

  const hit = await fetchSourcify(networkName, normalised)
  if (!hit) return null

  return {
    abi: hit.abi,
    contractName: getKnownContractName(networkName, normalised) ?? hit.contractName ?? null,
  }
}

const RESOLVED_ABI_QUERY_KEY = 'getResolvedAbi'

// The route's own max-age: re-asked eventually, so verifying a contract has an effect.
const CACHE_TIME_MS = 60 * 60 * 1_000

const resolvedAbiQueryOptions = (networkName: NetworkName, address: AddressString | null | undefined) =>
  queryOptions({
    queryKey: [RESOLVED_ABI_QUERY_KEY, networkName, address?.toLowerCase()],
    queryFn: address ? () => fetchResolvedAbi(networkName, address) : skipToken,
    staleTime: CACHE_TIME_MS,
    gcTime: CACHE_TIME_MS,
  })

export const useResolvedAbi = (address: AddressString | null | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(resolvedAbiQueryOptions(networkName ?? activeNetworkName, address))
}

// Server-callable variant for use inside other queryFns (e.g. revert
// decoding in services/thor/transaction.ts). Still runs in the browser
// when triggered by a hook, but does not depend on React state.
export { fetchResolvedAbi as getResolvedAbi }
