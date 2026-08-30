'use client'

import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { Address, ThorId } from '@vechain/sdk-core'
import type { Abi } from 'viem'
import { NetworkName } from '@/lib/constants/network'
import { getKnownContractAbi, getKnownContractName, isBuiltinAddress } from '@/lib/known-contracts'
import type { AddressString, HexString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

// EIP-1967 implementation storage slot.
const SLOT_IMPL = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as HexString

// Sourcify chain IDs as registered for VeChain.
const SOURCIFY_CHAIN_IDS: Partial<Record<NetworkName, number>> = {
  [NetworkName.MAINNET]: 100009,
  [NetworkName.TESTNET]: 100010,
}

interface SourcifyHit {
  abi: Abi
  contractName?: string
  // The address whose ABI we ultimately fetched. Equal to the queried
  // address when the contract is not a proxy, or to the impl when it is.
  resolvedAddress: AddressString
  isProxy: boolean
}

interface ResolvedAbi {
  abi: Abi
  // Display name: built-in name > curated name > Sourcify contractName > null.
  contractName: string | null
  // Where the ABI came from. 'known' means a bundled/built-in ABI;
  // 'sourcify' means it came from the Sourcify API.
  source: 'known' | 'sourcify'
  isProxy: boolean
  resolvedAddress: AddressString
}

const slotValueToAddress = (slotValue: string): AddressString | null => {
  if (!slotValue || !slotValue.startsWith('0x')) return null
  const hex = slotValue.slice(2).padStart(64, '0')
  const addr = ('0x' + hex.slice(24)) as AddressString
  if (/^0x0+$/.test(addr)) return null
  return addr.toLowerCase() as AddressString
}

const readImplSlot = async (networkName: NetworkName, address: AddressString): Promise<AddressString | null> => {
  try {
    const thorClient = getThorClient(networkName)
    const value = await thorClient.accounts.getStorageAt(Address.of(address), ThorId.of(SLOT_IMPL))
    return slotValueToAddress(value.toString())
  } catch {
    return null
  }
}

const fetchSourcify = async (chainId: number, address: AddressString): Promise<SourcifyHit | null> => {
  try {
    const response = await fetch(`/api/sourcify?chainId=${chainId}&address=${address}`)
    if (!response.ok) return null
    const body = (await response.json()) as { abi: Abi; contractName?: string }
    if (!body?.abi || !Array.isArray(body.abi)) return null
    return { abi: body.abi, contractName: body.contractName, resolvedAddress: address, isProxy: false }
  } catch {
    return null
  }
}

const fetchResolvedAbi = async (networkName: NetworkName, address: AddressString): Promise<ResolvedAbi | null> => {
  const normalised = address.toLowerCase() as AddressString
  const knownAbi = getKnownContractAbi(networkName, normalised)
  if (knownAbi && knownAbi.length > 0) {
    return {
      abi: knownAbi,
      contractName: getKnownContractName(networkName, normalised),
      source: 'known',
      isProxy: false,
      resolvedAddress: normalised,
    }
  }

  const chainId = SOURCIFY_CHAIN_IDS[networkName]
  if (!chainId) return null

  // Skip Sourcify entirely for the special non-CA built-in addresses — they
  // won't be there and we don't want a wasted round-trip.
  if (isBuiltinAddress(normalised)) return null

  // EIP-1967 proxy follow: read impl slot first; if it points somewhere,
  // try Sourcify on the impl, and fall back to the address itself on miss.
  const impl = await readImplSlot(networkName, normalised)
  if (implIsAddress(impl)) {
    const implHit = await fetchSourcify(chainId, impl)
    if (implHit) {
      return {
        abi: implHit.abi,
        contractName: getKnownContractName(networkName, normalised) ?? implHit.contractName ?? null,
        source: 'sourcify',
        isProxy: true,
        resolvedAddress: impl,
      }
    }
  }

  const directHit = await fetchSourcify(chainId, normalised)
  if (directHit) {
    return {
      abi: directHit.abi,
      contractName: getKnownContractName(networkName, normalised) ?? directHit.contractName ?? null,
      source: 'sourcify',
      isProxy: false,
      resolvedAddress: normalised,
    }
  }

  return null
}

const implIsAddress = (impl: AddressString | null): impl is AddressString => impl !== null

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
