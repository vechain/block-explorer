import type { NetworkName } from '@/lib/constants/network'
import { type BlockRevision, blockRevisionEnumSchema, expandedBlockDetailSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

const BLOCK_TIME = 10 * 1000 // 10 seconds

export const blockQueryOptions = (networkName: NetworkName, revision: BlockRevision) => ({
  queryKey: [getBlock.name, networkName, revision],
  queryFn: () => getBlock({ networkName, revision }),
  staleTime: Infinity,
})

export const bestBlockQueryOptions = (networkName: NetworkName) => ({
  queryKey: [getBlock.name, networkName, blockRevisionEnumSchema.enum.BEST],
  queryFn: () => getBlock({ networkName, revision: blockRevisionEnumSchema.enum.BEST }),
  refetchInterval: BLOCK_TIME,
  staleTime: BLOCK_TIME,
})

export const latestBlocksQueryOptions = (networkName: NetworkName, revision: BlockRevision) => ({
  queryKey: [getBlock.name, networkName, revision],
  queryFn: () => getBlock({ networkName, revision }),
  staleTime: Infinity,
})

export const getBlock = async ({ revision, networkName }: { revision: BlockRevision; networkName: NetworkName }) => {
  const thorClient = getThorClient(networkName)
  const block = await thorClient.blocks.getBlockExpanded(revision)

  return zodParse({
    data: block,
    schema: expandedBlockDetailSchema,
    errorMessage: 'Failed to parse block',
    fallbackData: null,
  })
}
