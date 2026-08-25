import { z } from 'zod'
import { type CacheProfile, defineEndpoint } from '@/lib/cached-proxy'
import { BLOCK_TIME_SECONDS, NETWORKS, NetworkName } from '@/lib/constants/network'
import { type ProxiedNetwork, proxiedNetworkSchema } from '@/lib/proxied-network'
import { concreteBlockRevisionSchema } from '@/lib/thor-proxy'
import { fetchUpstream, NotFoundError, UpstreamError } from '@/lib/upstream-error'

// Resolved server-side so the client can never steer the proxy at another host.
const THOR_BASE_URLS: Record<ProxiedNetwork, string> = {
  [NetworkName.MAINNET]: NETWORKS[NetworkName.MAINNET].url,
  [NetworkName.TESTNET]: NETWORKS[NetworkName.TESTNET].url,
}

const UPSTREAM_TIMEOUT_MS = 10_000

const expandedParam = z
  .enum(['true', 'false'])
  .default('false')
  .transform(value => value === 'true')

const fetchBlock = async ({
  network,
  revision,
  expanded,
}: {
  network: ProxiedNetwork
  revision: number | string
  expanded: boolean
}) => {
  const url = new URL(`${THOR_BASE_URLS[network]}/blocks/${revision}`)
  if (expanded) url.searchParams.set('expanded', 'true')

  const response = await fetchUpstream('thor', url, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    cache: 'no-store',
  })

  if (!response.ok) throw new UpstreamError('thor', response.status)

  const block = (await response.json()) as unknown
  // Thor answers an unknown block with 200 and a null body.
  if (block === null) throw new NotFoundError()

  return block
}

// Only a finalized block is settled: BFT rejects any branch that does not descend from
// the finalized checkpoint, so until then a fork can still reassign a height to another
// block. Finalized responses are therefore the only ones allowed to outlive a block.
const FINALIZED_BLOCK_TTL_SECONDS = 10 * 60

const finalizedBlockSchema = z.object({ isFinalized: z.boolean() })

const blockTtl = (block: unknown) => {
  const parsed = finalizedBlockSchema.safeParse(block)
  return parsed.success && parsed.data.isFinalized ? FINALIZED_BLOCK_TTL_SECONDS : BLOCK_TIME_SECONDS
}

const blockCache: CacheProfile = {
  ttl: blockTtl,
  // Added to the resolved ttl, so it stays at one block: an unsettled block may be served
  // for at most two, a finalized one for the full lifetime.
  stale: BLOCK_TIME_SECONDS,
  browserMaxAge: FINALIZED_BLOCK_TTL_SECONDS,
  size: 500,
}

// Capped at half a block, matching the indexer's live feeds.
const bestBlockCache: CacheProfile = {
  ttl: BLOCK_TIME_SECONDS / 2,
  stale: BLOCK_TIME_SECONDS / 2,
  size: 8,
}

// Short-lived: a revision that is merely ahead of the head becomes a real block later.
const blockNotFound = {
  ttl: BLOCK_TIME_SECONDS,
  stale: BLOCK_TIME_SECONDS,
  size: 256,
  message: 'Block not found',
}

export const THOR_ENDPOINTS = {
  blocks: defineEndpoint({
    params: z.object({
      network: proxiedNetworkSchema,
      revision: concreteBlockRevisionSchema,
      expanded: expandedParam,
    }),
    cache: blockCache,
    notFound: blockNotFound,
    fetch: fetchBlock,
  }),

  'blocks/best': defineEndpoint({
    params: z.object({ network: proxiedNetworkSchema }),
    cache: bestBlockCache,
    fetch: ({ network }) => fetchBlock({ network, revision: 'best', expanded: false }),
  }),
}
