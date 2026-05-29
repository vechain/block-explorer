'use client'

import type { NetworkName } from '@/lib/constants/network'
import { getKnownContractName } from '@/lib/known-contracts'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { useResolvedAbi } from '@/services/sourcify'

// Resolves a human-readable name for a contract address: built-in protocol
// name, curated VeBetterDAO/Stargate name, or Sourcify metadata name.
// Returns null when nothing matches.
export const useContractName = (address: AddressString | null | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const network = networkName ?? activeNetworkName

  const localName = getKnownContractName(network, address)
  // If we already have a curated/built-in name, don't fire a Sourcify lookup.
  const { data: resolved, isPending } = useResolvedAbi(localName ? null : (address ?? null), network)

  return {
    name: localName ?? resolved?.contractName ?? null,
    isPending: localName ? false : isPending,
  }
}
