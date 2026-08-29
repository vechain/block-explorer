import { z } from 'zod'
import { INDEXER_RATE_LIMIT_BYPASS } from '@/env.api'
import { VEWORLD_INDEXER_MAINNET_URL, VEWORLD_INDEXER_TESTNET_URL } from '@/env.public'
import { type CacheProfile, defineEndpoint } from '@/lib/cached-proxy'
import { BLOCK_TIME_SECONDS, NetworkName } from '@/lib/constants/network'
import { type CachedIndexerEndpoint } from '@/lib/indexer-proxy'
import { type ProxiedNetwork, proxiedNetworkSchema } from '@/lib/proxied-network'
import { fetchUpstream, UpstreamError } from '@/lib/upstream-error'
import { INDEXER_HEADERS } from '@/services/veworld-indexer'

// Resolved server-side so the client can never steer the proxy at another host.
const INDEXER_BASE_URLS: Record<ProxiedNetwork, string> = {
  [NetworkName.MAINNET]: VEWORLD_INDEXER_MAINNET_URL,
  [NetworkName.TESTNET]: VEWORLD_INDEXER_TESTNET_URL,
}

const UPSTREAM_TIMEOUT_MS = 10_000

const RATE_LIMIT_BYPASS_HEADER: Record<string, string> = INDEXER_RATE_LIMIT_BYPASS
  ? { 'x-rate-limit-bypass': INDEXER_RATE_LIMIT_BYPASS }
  : {}

// Mirrors the VeWorld Indexer OpenAPI contract (v6.39.0).
const MAX_PAGE_SIZE = 150
const MAX_PAGE = 2_147_483_647
const MAX_CURSOR_LENGTH = 512
// A uint256 is at most 78 decimal digits, but not every 78-digit value is one.
const MAX_TOKEN_ID_LENGTH = 78
const MAX_TOKEN_ID = 2n ** 256n - 1n

const addressParam = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform(address => address.toLowerCase())

const booleanParam = z
  .enum(['true', 'false'])
  .default('false')
  .transform(value => value === 'true')

// Unix seconds. Bounded so a caller cannot fork the cache with arbitrary integers.
const timestampParam = z.coerce.number().int().min(0).max(MAX_PAGE)

const pageSizeParam = z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(10)
const pageParam = z.coerce.number().int().min(0).max(MAX_PAGE).default(0)

// Defaulted to the upstream default so an explicit DESC and an omitted value share a key.
const directionParam = z.enum(['ASC', 'DESC']).default('DESC')

// Undefaulted: sending a DESC the caller omitted would reorder the page, not just the key.
const optionalDirectionParam = z.enum(['ASC', 'DESC']).optional()

// Left undefaulted: the upstream default is unspecified, so absence must stay absent.
const optionalBooleanParam = z
  .enum(['true', 'false'])
  .transform(value => value === 'true')
  .optional()

// Length-capped before parsing, then value-bounded; canonicalized so `007` and `7` are
// one entry rather than two spellings of the same token.
const tokenIdParam = z
  .string()
  .max(MAX_TOKEN_ID_LENGTH)
  .regex(/^\d+$/)
  .transform(tokenId => BigInt(tokenId))
  .refine(tokenId => tokenId <= MAX_TOKEN_ID)
  .transform(tokenId => tokenId.toString())

// Upstream cursors are `blockNumber|index`, so the pipe belongs in the allowlist.
const cursorParam = z
  .string()
  .max(MAX_CURSOR_LENGTH)
  .regex(/^[A-Za-z0-9._~:+/=|-]+$/)
  .optional()

// Left optional rather than defaulted: the upstream returns every status when it is absent.
const validatorStatusParam = z.enum(['NONE', 'QUEUED', 'ACTIVE', 'EXITED', 'EXITING']).optional()

// Repeated query param (`?eventType=VET&eventType=NFT`). Deduped so a filter repeating a
// value shares one entry with the plain filter; the factory sorts the values in the key.
const eventTypeParam = z
  .array(z.enum(['VET', 'FUNGIBLE_TOKEN', 'NFT', 'SEMI_FUNGIBLE_TOKEN']))
  .nonempty()
  .transform(eventTypes => [...new Set(eventTypes)])
  .optional()

const fetchIndexer = async ({
  network,
  endPoint,
  params,
  version = 'v1',
}: {
  network: ProxiedNetwork
  endPoint: string
  params: Record<string, unknown>
  version?: 'v1' | 'v2'
}) => {
  const url = new URL(`${INDEXER_BASE_URLS[network]}/api/${version}/${endPoint}`)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    // Array params are repeated keys upstream, not one comma-joined value.
    if (Array.isArray(value)) value.forEach(item => url.searchParams.append(key, String(item)))
    else url.searchParams.set(key, String(value))
  }

  const response = await fetchUpstream('veworld-indexer', url, {
    headers: { 'Content-Type': 'application/json', ...INDEXER_HEADERS, ...RATE_LIMIT_BYPASS_HEADER },
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
      includeDelegated: optionalBooleanParam,
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

  'transfers/latest': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      size: pageSizeParam,
      eventType: eventTypeParam,
      cursor: cursorParam,
    }),
    arrayParams: ['eventType'],
    cache: liveCache(500),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'transfers/latest', params }),
  }),

  transfers: defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      // Upstream also accepts tokenAddress on its own; every proxied caller sends an address.
      address: addressParam,
      tokenAddress: addressParam.optional(),
      eventType: eventTypeParam,
      page: pageParam,
      size: pageSizeParam,
      direction: directionParam,
    }),
    arrayParams: ['eventType'],
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'transfers', params }),
  }),

  'explorer/block-usage': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      startTimestamp: timestampParam,
      endTimestamp: timestampParam,
    }),
    // Callers round endTimestamp to a block boundary, which is what keeps this to one
    // entry per block rather than one per caller per second.
    cache: liveCache(64),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'explorer/block-usage', params }),
  }),

  // Registry keys are proxy paths, and the proxy keys a cache entry on the path plus the
  // validated query. An address the upstream takes in its path therefore has to arrive as
  // a query param and be spliced back in below.
  'accounts/overview': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema, address: addressParam }),
    cache: liveCache(2_000),
    fetch: ({ network, address }) => fetchIndexer({ network, endPoint: `accounts/overview/${address}`, params: {} }),
  }),

  'accounts/total': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema }),
    cache: liveCache(8),
    fetch: ({ network }) => fetchIndexer({ network, endPoint: 'accounts/total', params: {}, version: 'v2' }),
  }),

  'accounts/totals': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      startTimestamp: timestampParam,
      endTimestamp: timestampParam,
    }),
    cache: liveCache(64),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'accounts/totals', params, version: 'v2' }),
  }),

  'stargate/total-vet-staked': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema }),
    cache: liveCache(8),
    fetch: ({ network }) => fetchIndexer({ network, endPoint: 'stargate/total-vet-staked', params: {} }),
  }),

  validators: defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      page: pageParam,
      size: pageSizeParam,
      endorser: addressParam.optional(),
      status: validatorStatusParam,
    }),
    cache: liveCache(500),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'validators', params, version: 'v2' }),
  }),

  'validators/details': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema, address: addressParam }),
    cache: liveCache(500),
    fetch: ({ network, address }) =>
      fetchIndexer({ network, endPoint: `validators/${address}`, params: {}, version: 'v2' }),
  }),

  'validators/slots': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      address: addressParam,
      startTimestamp: timestampParam,
      endTimestamp: timestampParam,
    }),
    // Callers round the window to a block boundary, as block-usage does.
    cache: liveCache(500),
    fetch: ({ network, address, ...params }) =>
      fetchIndexer({ network, endPoint: `validators/${address}/slots`, params, version: 'v2' }),
  }),

  'validators/delegations': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      validator: addressParam,
      page: pageParam,
      size: pageSizeParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'validators/delegations', params }),
  }),

  'validators/delegations/count': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema, validator: addressParam }),
    cache: liveCache(500),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'validators/delegations/count', params }),
  }),

  'contracts/details': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema, address: addressParam }),
    cache: liveCache(2_000),
    fetch: ({ network, address }) => fetchIndexer({ network, endPoint: `contracts/${address}`, params: {} }),
  }),

  'contracts/by-master': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      address: addressParam,
      page: pageParam,
      size: pageSizeParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, address, ...params }) =>
      fetchIndexer({ network, endPoint: `contracts/by-master/${address}`, params }),
  }),

  'transfers/fungible-tokens-contracts': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      address: addressParam,
      officialTokensOnly: optionalBooleanParam,
      page: pageParam,
      size: pageSizeParam,
      direction: optionalDirectionParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) =>
      fetchIndexer({ network, endPoint: 'transfers/fungible-tokens-contracts', params }),
  }),

  nfts: defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      address: addressParam,
      contractAddress: addressParam.optional(),
      tokenId: tokenIdParam.optional(),
      page: pageParam,
      size: pageSizeParam,
      direction: optionalDirectionParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'nfts', params }),
  }),

  'nfts/history': defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      contractAddress: addressParam,
      tokenId: tokenIdParam,
      page: pageParam,
      size: pageSizeParam,
      direction: optionalDirectionParam,
    }),
    cache: liveCache(2_000),
    fetch: ({ network, ...params }) => fetchIndexer({ network, endPoint: 'nfts/history', params }),
  }),
} satisfies Record<CachedIndexerEndpoint, ReturnType<typeof defineEndpoint>>
