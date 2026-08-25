import { z } from 'zod'
import { VEWORLD_INDEXER_MAINNET_URL, VEWORLD_INDEXER_TESTNET_URL } from '@/env.public'
import { type CacheProfile, defineEndpoint } from '@/lib/cached-proxy'
import { BLOCK_TIME_SECONDS, NetworkName } from '@/lib/constants/network'
import { type CachedIndexerEndpoint, type ProxiedNetwork, proxiedNetworkSchema } from '@/lib/indexer-proxy'
import { fetchUpstream, UpstreamError } from '@/lib/upstream-error'
import { INDEXER_HEADERS } from '@/services/veworld-indexer'

// Resolved server-side so the client can never steer the proxy at another host.
const INDEXER_BASE_URLS: Record<ProxiedNetwork, string> = {
  [NetworkName.MAINNET]: VEWORLD_INDEXER_MAINNET_URL,
  [NetworkName.TESTNET]: VEWORLD_INDEXER_TESTNET_URL,
}

const UPSTREAM_TIMEOUT_MS = 10_000

// Mirrors the VeWorld Indexer OpenAPI contract (v6.39.0).
const MAX_PAGE_SIZE = 150
const MAX_PAGE = 2_147_483_647
const MAX_CURSOR_LENGTH = 512

const addressParam = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform(address => address.toLowerCase())

const booleanParam = z
  .enum(['true', 'false'])
  .default('false')
  .transform(value => value === 'true')

const pageSizeParam = z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(10)
const pageParam = z.coerce.number().int().min(0).max(MAX_PAGE).default(0)

// Defaulted to the upstream default so an explicit DESC and an omitted value share a key.
const directionParam = z.enum(['ASC', 'DESC']).default('DESC')

// Left undefaulted: the upstream default is unspecified, so absence must stay absent.
const includeDelegatedParam = z
  .enum(['true', 'false'])
  .transform(value => value === 'true')
  .optional()

const cursorParam = z
  .string()
  .max(MAX_CURSOR_LENGTH)
  .regex(/^[A-Za-z0-9._~:+/=-]+$/)
  .optional()

const fetchIndexer = async ({
  network,
  endPoint,
  params,
}: {
  network: ProxiedNetwork
  endPoint: string
  params: Record<string, unknown>
}) => {
  const url = new URL(`${INDEXER_BASE_URLS[network]}/api/v1/${endPoint}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetchUpstream('veworld-indexer', url, {
    headers: { 'Content-Type': 'application/json', ...INDEXER_HEADERS },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    cache: 'no-store',
  })

  if (!response.ok) throw new UpstreamError('veworld-indexer', response.status)

  return response.json() as Promise<unknown>
}

// An entry is served for up to ttl + stale, so anything reflecting chain state is
// capped at one block. Longer-lived resources warrant their own profile.
const liveCache = (size: number): CacheProfile => ({
  ttl: BLOCK_TIME_SECONDS / 2,
  stale: BLOCK_TIME_SECONDS / 2,
  size,
})

// `network` is required on every endpoint, so it is part of every cache key. It selects
// the upstream host and is not forwarded to the indexer.
export const INDEXER_ENDPOINTS = {
  'transactions/latest': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      size: pageSizeParam,
      expanded: booleanParam,
      cursor: cursorParam,
    }),
    cache: liveCache(500),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'transactions/latest', params }),
  }),

  transactions: defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      origin: addressParam,
      page: pageParam,
      size: pageSizeParam,
      expanded: booleanParam,
      direction: directionParam,
      includeDelegated: includeDelegatedParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'transactions', params }),
  }),

  'transactions/contract': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      contractAddress: addressParam,
      page: pageParam,
      size: pageSizeParam,
      expanded: booleanParam,
      direction: directionParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'transactions/contract', params }),
  }),
} satisfies Record<CachedIndexerEndpoint, ReturnType<typeof defineEndpoint>>
