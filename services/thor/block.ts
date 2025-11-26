import { queryOptions, skipToken } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { type BlockId, type BlockRevision, blockCompressedSchema, blockExpandedSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

/**
 * Best block compressed
 */

const BLOCK_TIME = 10 * 1000 // 10 seconds

export const bestBlockCompressedQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [getBestBlockCompressed.name, networkName],
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
    fallbackData: null,
  })
}

/**
 * Expanded block
 */

export const blockExpandedQueryOptions = (networkName: NetworkName, revision: BlockRevision | undefined) =>
  queryOptions({
    queryKey: [getBlockExpanded.name, networkName, revision],
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
    fallbackData: null,
  })
}

/**
 * Compressed block
 */

export const blockCompressedQueryOptions = ({
  networkName,
  revision,
}: {
  networkName: NetworkName
  revision: BlockRevision | undefined
}) =>
  queryOptions({
    queryKey: [getBlockCompressed.name, networkName, revision],
    queryFn: revision ? () => getBlockCompressed({ networkName, revision }) : skipToken,
    staleTime: Infinity,
  })

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
    fallbackData: null,
  })
}

/**
 * Base fee per gas
 */

export const baseFeePerGasQueryOptions = (networkName: NetworkName, blockId: BlockId | undefined) =>
  queryOptions({
    queryKey: [getBlockCompressed.name, networkName, blockId],
    queryFn: blockId ? () => getBlockCompressed({ networkName, revision: blockId }) : skipToken,
    select: data => data.baseFeePerGas,
  })
