import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'

// Client-safe: no server-only imports, so services can pick proxy vs direct.

// Solo is excluded — its node and indexer URLs are browser-local and unresolvable
// server-side.
const PROXIED_NETWORKS = [NetworkName.MAINNET, NetworkName.TESTNET] as const

export type ProxiedNetwork = (typeof PROXIED_NETWORKS)[number]

/** Never defaulted — an absent network must 400, not fall back to mainnet. */
export const proxiedNetworkSchema = z.enum(PROXIED_NETWORKS)

export const isProxiedNetwork = (networkName: NetworkName): networkName is ProxiedNetwork =>
  proxiedNetworkSchema.safeParse(networkName).success
