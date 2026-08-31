import type { Abi } from 'viem'
import { z } from 'zod'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { type ProxiedNetwork } from '@/lib/proxied-network'
import { getRuntimeConfig } from '@/lib/runtime-config/get'
import { fetchUpstream, UpstreamError } from '@/lib/upstream-error'

const SOURCIFY_TIMEOUT_MS = 10_000
const NODE_TIMEOUT_MS = 5_000

// Sourcify chain IDs as registered for VeChain.
const SOURCIFY_CHAIN_IDS: Record<ProxiedNetwork, number> = {
  [NetworkName.MAINNET]: 100009,
  [NetworkName.TESTNET]: 100010,
}

// EIP-1967 implementation storage slot.
const SLOT_IMPL = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

interface SourcifyHit {
  abi: Abi
  contractName?: string
}

// v2 returns the ABI as a top-level field via `?fields=abi,compilation`. v1 is being
// deprecated through 503 brownouts, so we use v2 directly.
interface SourcifyV2Response {
  abi?: Abi
  compilation?: {
    name?: string
    fullyQualifiedName?: string
  }
  match?: string | null
}

const storageSchema = z.object({ value: z.string().regex(/^0x[a-fA-F0-9]{64}$/) })

const slotValueToAddress = (value: string) => {
  const address = `0x${value.slice(26)}`.toLowerCase()
  return /^0x0+$/.test(address) ? null : address
}

// An empty slot and an unread one are not the same answer, and only one is conclusive.
type SlotRead = { read: true; implementation: string | null } | { read: false }

// Sent without headers: the Thor nodes answer a CORS preflight with 403.
const readImplementation = async (network: ProxiedNetwork, address: string): Promise<SlotRead> => {
  try {
    const response = await fetch(`${NETWORKS[network].url}/accounts/${address}/storage/${SLOT_IMPL}`, {
      signal: AbortSignal.timeout(NODE_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) return { read: false }

    const parsed = storageSchema.safeParse(await response.json())
    return parsed.success ? { read: true, implementation: slotValueToAddress(parsed.data.value) } : { read: false }
  } catch {
    return { read: false }
  }
}

const fetchContract = async (chainId: number, address: string): Promise<SourcifyHit | null> => {
  const res = await fetchUpstream(
    'sourcify',
    `${getRuntimeConfig().sourcifyUrl}/v2/contract/${chainId}/${address}?fields=abi,compilation`,
    { signal: AbortSignal.timeout(SOURCIFY_TIMEOUT_MS) },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new UpstreamError('sourcify', res.status)

  const body = (await res.json()) as SourcifyV2Response
  if (!body.abi || !Array.isArray(body.abi) || body.abi.length === 0) return null

  return { abi: body.abi, contractName: body.compilation?.name }
}

/** Follows an EIP-1967 proxy to its implementation first. Null is a miss; a throw is an outage. */
export const fetchSourcifyAbi = async (network: ProxiedNetwork, address: string): Promise<SourcifyHit | null> => {
  const chainId = SOURCIFY_CHAIN_IDS[network]

  const slot = await readImplementation(network, address)
  if (slot.read && slot.implementation && slot.implementation !== address) {
    const proxied = await fetchContract(chainId, slot.implementation)
    if (proxied) return proxied
  }

  const direct = await fetchContract(chainId, address)
  if (direct) return direct

  // Half a lookup is not a miss, and a miss is what the caller caches for the session.
  if (!slot.read) throw new UpstreamError('thor', 502)

  return null
}
