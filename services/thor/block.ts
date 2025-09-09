import { Revision } from '@vechain/sdk-core'
import type { ThorClient } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import { expandedBlockDetailSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'

const BLOCK_TIME = 10 * 1000 // 10 seconds

export const blockQueryOptions = (thorClient: ThorClient, networkName: NetworkName, revision: Revision) => ({
  queryKey: [getBlock.name, networkName, revision.toString()],
  queryFn: () => getBlock({ thorClient, revision }),
  staleTime: Infinity,
})

export const bestBlockQueryOptions = (thorClient: ThorClient, networkName: NetworkName) => ({
  queryKey: [getBlock.name, networkName, Revision.BEST.toString()],
  queryFn: () => getBlock({ thorClient, revision: Revision.BEST }),
  refetchInterval: BLOCK_TIME,
  staleTime: BLOCK_TIME,
})

export const latestBlocksQueryOptions = (thorClient: ThorClient, networkName: NetworkName, blockId: number) => ({
  queryKey: [getBlock.name, networkName, blockId],
  queryFn: () => getBlock({ thorClient, revision: Revision.of(blockId) }),
  staleTime: Infinity,
})

export const getBlock = async ({ thorClient, revision }: { thorClient: ThorClient; revision: Revision }) => {
  const block = await thorClient.blocks.getBlockExpanded(revision.toString())

  if (!block) return null

  return zodParse({
    data: block,
    schema: expandedBlockDetailSchema,
    errorMessage: 'Failed to parse block',
  })
}
