import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { type BlockId, type BlockRevision, blockCompressedSchema, blockExpandedSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

const BEST_BLOCK_COMPRESSED_QUERY_KEY = 'getBestBlockCompressed'
const BLOCK_EXPANDED_QUERY_KEY = 'getBlockExpanded'
const BLOCK_COMPRESSED_QUERY_KEY = 'getBlockCompressed'

const BLOCK_TIME = 10 * 1000 // 10 seconds

export const bestBlockCompressedQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [BEST_BLOCK_COMPRESSED_QUERY_KEY, networkName],
    queryFn: () => getBestBlockCompressed({ networkName }),
    refetchInterval: BLOCK_TIME,
  })

const getBestBlockCompressed = async ({ networkName }: { networkName: NetworkName }) => {
  const thorClient = getThorClient(networkName)
  const block = await thorClient.blocks.getBestBlockCompressed()

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
  const thorClient = getThorClient(networkName)
  const block = await thorClient.blocks.getBlockExpanded(revision)
  return zodParse({
    data: block,
    schema: blockExpandedSchema,
    errorMessage: `Failed to parse block expanded ${revision}`,
  })
}

export const getBlockCompressed = async ({
  revision,
  networkName,
}: {
  revision: BlockRevision
  networkName: NetworkName
}) => {
  const thorClient = getThorClient(networkName)
  const block = await thorClient.blocks.getBlockCompressed(revision)

  return zodParse({
    data: block,
    schema: blockCompressedSchema,
    errorMessage: `Failed to parse block compressed ${revision}`,
  })
}

/**
 * Base fee per gas
 */

const baseFeePerGasQueryOptions = (networkName: NetworkName, blockId: BlockId | undefined) =>
  queryOptions({
    queryKey: [BLOCK_COMPRESSED_QUERY_KEY, networkName, blockId],
    queryFn: blockId ? () => getBlockCompressed({ networkName, revision: blockId }) : skipToken,
    select: data => data.baseFeePerGas,
  })

export const useBestBlockCompressed = (networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(bestBlockCompressedQueryOptions(networkName ?? activeNetworkName))
}

export const useBlockExpanded = (revision: BlockRevision | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockExpandedQueryOptions(activeNetwork.name, revision))
}

export const useBaseFeePerGas = (blockId: BlockId | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(baseFeePerGasQueryOptions(networkName ?? activeNetworkName, blockId))
}
