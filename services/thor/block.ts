import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/api'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { isProxiedNetwork } from '@/lib/proxied-network'
import { proxyBaseUrl } from '@/lib/proxy-base-url'
import { type BlockRevision, blockCompressedSchema, blockExpandedSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { BEST_BLOCK_ENDPOINT, BLOCK_ENDPOINT, isConcreteBlockRevision, THOR_PROXY_BASE } from '@/lib/thor-proxy'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

const BEST_BLOCK_COMPRESSED_QUERY_KEY = 'getBestBlockCompressed'
const BLOCK_EXPANDED_QUERY_KEY = 'getBlockExpanded'
const BLOCK_COMPRESSED_QUERY_KEY = 'getBlockCompressed'

/**
 * Blocks come from the node rather than the indexer, so they go through our own cache at
 * `/api/thor` — without it every viewer fetches the same block from the public node.
 * Solo goes direct, its node URL being browser-local.
 */
const shouldProxy = (networkName: NetworkName) => isProxiedNetwork(networkName)

const getBlockViaProxy = async ({ endPoint, params }: { endPoint: string; params: Record<string, string> }) => {
  try {
    const { data } = await apiClient.get<unknown>({ baseUrl: proxyBaseUrl(THOR_PROXY_BASE), endPoint, params })
    return data
  } catch (error) {
    // The proxy turns Thor's null body into a 404; callers expect an absent block.
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export const bestBlockCompressedQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [BEST_BLOCK_COMPRESSED_QUERY_KEY, networkName],
    queryFn: () => getBestBlockCompressed({ networkName }),
    refetchInterval: BLOCK_TIME_MS,
  })

const getBestBlockCompressed = async ({ networkName }: { networkName: NetworkName }) => {
  const block = shouldProxy(networkName)
    ? await getBlockViaProxy({ endPoint: BEST_BLOCK_ENDPOINT, params: { network: networkName } })
    : await getThorClient(networkName).blocks.getBestBlockCompressed()

  return zodParse({
    data: block,
    schema: blockCompressedSchema,
    errorMessage: 'Failed to parse best block compressed',
  })
}

/**
 * Expanded block
 */

export const blockExpandedQueryOptions = (networkName: NetworkName, revision: BlockRevision | undefined) =>
  queryOptions({
    queryKey: [BLOCK_EXPANDED_QUERY_KEY, networkName, revision],
    queryFn: revision ? () => getBlockExpanded({ networkName, revision }) : skipToken,
    staleTime: Infinity,
  })

const getBlockExpanded = async ({ revision, networkName }: { revision: BlockRevision; networkName: NetworkName }) => {
  const block = await getBlock({ networkName, revision, expanded: true })

  return zodParse({
    data: block,
    schema: blockExpandedSchema,
    errorMessage: `Failed to parse block expanded ${revision}`,
  })
}

const getBlock = async ({
  networkName,
  revision,
  expanded,
}: {
  networkName: NetworkName
  revision: BlockRevision
  expanded: boolean
}) => {
  if (shouldProxy(networkName) && isConcreteBlockRevision(revision)) {
    return getBlockViaProxy({
      endPoint: BLOCK_ENDPOINT,
      params: { network: networkName, revision: String(revision), expanded: String(expanded) },
    })
  }

  const thorClient = getThorClient(networkName)
  return expanded ? thorClient.blocks.getBlockExpanded(revision) : thorClient.blocks.getBlockCompressed(revision)
}

export const getBlockCompressed = async ({
  revision,
  networkName,
}: {
  revision: BlockRevision
  networkName: NetworkName
}) => {
  const block = await getBlock({ networkName, revision, expanded: false })

  return zodParse({
    data: block,
    schema: blockCompressedSchema,
    errorMessage: `Failed to parse block compressed ${revision}`,
  })
}

export const blockCompressedQueryOptions = (networkName: NetworkName, revision: BlockRevision | undefined) =>
  queryOptions({
    queryKey: [BLOCK_COMPRESSED_QUERY_KEY, networkName, revision],
    queryFn: revision ? () => getBlockCompressed({ networkName, revision }) : skipToken,
    staleTime: Infinity,
  })

export const useBestBlockCompressed = (networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(bestBlockCompressedQueryOptions(networkName ?? activeNetworkName))
}

export const useBlockExpanded = (revision: BlockRevision | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockExpandedQueryOptions(activeNetwork.name, revision))
}
