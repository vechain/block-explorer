'use client'

import type { NetworkName } from '@/lib/constants/network'
import { getKnownContractName } from '@/lib/known-contracts'
import { getTokenRegistryEntry } from '@/lib/constants/token-registry'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { useResolvedAbi } from '@/services/sourcify'

/**
 * Resolves a human-readable name for a contract address. Priority:
 *
 *  1. Bundled known contracts (protocol built-ins + curated VeBetterDAO /
 *     Stargate names) — fastest, hand-curated names.
 *  2. vechain/token-registry — picks up the long tail of ERC-20s / ERC-721s
 *     that aren't in our curated set. We prefer the registry's symbol
 *     (B3TR, USDT, …) over the full name since it's what users recognise
 *     in a tx clause / event header.
 *  3. Sourcify metadata.contractName — fires only when the first two miss,
 *     and inherits the proxy-aware lookup the decoder already does.
 *
 * Returns null when nothing matches.
 */
export const useContractName = (address: AddressString | null | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const network = networkName ?? activeNetworkName

  const knownName = getKnownContractName(network, address)
  const registryEntry = !knownName && address ? getTokenRegistryEntry(network, address) : null
  const registryName = registryEntry?.symbol ?? registryEntry?.name ?? null

  const localName = knownName ?? registryName

  // If we already have a curated/built-in or registry name, don't fire a
  // Sourcify lookup.
  const { data: resolved, isPending } = useResolvedAbi(localName ? null : (address ?? null), network)

  return {
    name: localName ?? resolved?.contractName ?? null,
    isPending: localName ? false : isPending,
  }
}
