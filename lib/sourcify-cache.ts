import type { Abi } from 'viem'
import { z } from 'zod'
import { SOURCIFY_URL } from '@/env.api'
import { defineEndpoint } from '@/lib/cached-proxy'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { type ProxiedNetwork, proxiedNetworkSchema } from '@/lib/proxied-network'
import { fetchUpstream, NotFoundError, UpstreamError } from './upstream-error'

const HOUR = 3_600
const DAY = 86_400
const WEEK = 604_800

const SOURCIFY_TIMEOUT_MS = 10_000
const NODE_TIMEOUT_MS = 5_000

// Sourcify chain IDs as registered for VeChain.
const SOURCIFY_CHAIN_IDS: Record<ProxiedNetwork, number> = {
  [NetworkName.MAINNET]: 100009,
  [NetworkName.TESTNET]: 100010,
}

const NODE_URLS: Record<ProxiedNetwork, string> = {
  [NetworkName.MAINNET]: NETWORKS[NetworkName.MAINNET].url,
  [NetworkName.TESTNET]: NETWORKS[NetworkName.TESTNET].url,
}

// EIP-1967 implementation storage slot.
const SLOT_IMPL = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

interface SourcifyHit {
  abi: Abi
  contractName?: string
  isProxy?: boolean
}

// An upgrade moves the slot, so a followed proxy keeps a hit no longer than a miss.
const hitTtl = (result: unknown) => ((result as SourcifyHit)?.isProxy ? HOUR : DAY)

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

// An empty slot and an unread one are not the same answer, and only one is cacheable.
type SlotRead = { read: true; implementation: string | null } | { read: false }

const readImplementation = async (network: ProxiedNetwork, address: string): Promise<SlotRead> => {
  try {
    const response = await fetch(`${NODE_URLS[network]}/accounts/${address}/storage/${SLOT_IMPL}`, {
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
    `${SOURCIFY_URL}/v2/contract/${chainId}/${address}?fields=abi,compilation`,
    {
      signal: AbortSignal.timeout(SOURCIFY_TIMEOUT_MS),
    },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new UpstreamError('sourcify', res.status)

  const body = (await res.json()) as SourcifyV2Response
  if (!body.abi || !Array.isArray(body.abi) || body.abi.length === 0) return null

  return { abi: body.abi, contractName: body.compilation?.name }
}

export const sourcifyEndpoint = defineEndpoint({
  params: z.object({
    network: proxiedNetworkSchema,
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .transform(address => address.toLowerCase()),
  }),
  invalidParamsMessage: 'network must be mainnet or testnet and address must be a hex address',

  cache: { ttl: hitTtl, stale: WEEK, browserMaxAge: HOUR, size: 10_000 },

  // Shorter than a hit: verifying a contract is the one thing that changes this answer.
  notFound: {
    ttl: HOUR,
    stale: WEEK,
    browserMaxAge: HOUR,
    size: 10_000,
    message: 'Contract not verified on Sourcify',
  },

  // The EIP-1967 follow runs here so one cached answer covers the slot read too.
  fetch: async ({ network, address }): Promise<SourcifyHit> => {
    const chainId = SOURCIFY_CHAIN_IDS[network]

    const slot = await readImplementation(network, address)
    if (slot.read && slot.implementation && slot.implementation !== address) {
      const proxied = await fetchContract(chainId, slot.implementation)
      if (proxied) return { ...proxied, isProxy: true }
    }

    const direct = await fetchContract(chainId, address)
    if (direct) return direct

    // Half a lookup is not a miss, and a miss is what gets cached for an hour.
    if (!slot.read) throw new UpstreamError('thor', 502)

    throw new NotFoundError()
  },
})
