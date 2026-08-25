import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'

// Client-safe: no server-only imports, so services can pick proxy vs direct.

// Solo is excluded — its indexer URL is browser-local and unresolvable server-side.
const PROXIED_NETWORKS = [NetworkName.MAINNET, NetworkName.TESTNET] as const

export type ProxiedNetwork = (typeof PROXIED_NETWORKS)[number]

/** Never defaulted — an absent network must 400, not fall back to mainnet. */
export const proxiedNetworkSchema = z.enum(PROXIED_NETWORKS)

export const isProxiedNetwork = (networkName: NetworkName): networkName is ProxiedNetwork =>
  proxiedNetworkSchema.safeParse(networkName).success

/** Relative to `/api/v1`. The server registry must define exactly these. */
const CACHED_INDEXER_ENDPOINTS = [
  'transactions/latest',
  'transactions',
  'transactions/contract',
  'transfers/latest',
  'transfers',
] as const

export type CachedIndexerEndpoint = (typeof CACHED_INDEXER_ENDPOINTS)[number]

export const isCachedIndexerEndpoint = (endPoint: string): endPoint is CachedIndexerEndpoint =>
  (CACHED_INDEXER_ENDPOINTS as readonly string[]).includes(endPoint.replace(/^\/+/, ''))

export const INDEXER_PROXY_BASE = '/api/indexer'
