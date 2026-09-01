import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { type BlockRevision, blockCompressedSchema, blockExpandedSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

const BEST_BLOCK_COMPRESSED_QUERY_KEY = 'getBestBlockCompressed'
const BLOCK_EXPANDED_QUERY_KEY = 'getBlockExpanded'

export const bestBlockCompressedQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [BEST_BLOCK_COMPRESSED_QUERY_KEY, networkName],
    queryFn: () => getBestBlockCompressed({ networkName }),
    refetchInterval: BLOCK_TIME_MS,
  })

const getBestBlockCompressed = async ({ networkName }: { networkName: NetworkName }) => {
  const block = await getThorClient(networkName).blocks.getBestBlockCompressed()

  return zodParse({
    data: block,
    schema: blockCompressedSchema,
    errorMessage: 'Failed to parse best block compressed',
  })
}

/**
 * Expanded block
 */

const blockExpandedQueryOptions = (networkName: NetworkName, revision: BlockRevision | undefined) =>
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

const getBlock = ({
  networkName,
  revision,
  expanded,
}: {
  networkName: NetworkName
  revision: BlockRevision
  expanded: boolean
}) => {
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

export const useBestBlockCompressed = (networkName?: NetworkName, { enabled = true } = {}) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery({ ...bestBlockCompressedQueryOptions(networkName ?? activeNetworkName), enabled })
}

export const useBlockExpanded = (revision: BlockRevision | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockExpandedQueryOptions(activeNetwork.name, revision))
}
