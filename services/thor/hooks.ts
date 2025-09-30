import { useQueries, useQuery } from '@tanstack/react-query'
import type { AddressString, BlockRevision, ExpandedBlockDetail, TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { accountQueryOptions } from './account'
import { bestBlockQueryOptions, blockQueryOptions, latestBlocksQueryOptions } from './block'
import { transactionQueryOptions, transactionReceiptQueryOptions } from './transaction'
import { vnsNameQueryOptions } from './vns'

export const useAccount = (address: AddressString) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountQueryOptions(activeNetwork.name, address))
}

export const useBlock = (revision: BlockRevision) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockQueryOptions(activeNetwork.name, revision))
}

const useBestBlock = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(bestBlockQueryOptions(activeNetwork.name))
}

export const useLatestBlocks = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? count
  const blockIds = []

  for (let i = 0; i < count; i++) {
    const currentBlockId = bestBlockNumber - i
    if (currentBlockId > 0) {
      blockIds.push(currentBlockId)
    }
  }

  return useQueries({
    queries: blockIds.map(blockId => latestBlocksQueryOptions(activeNetwork.name, blockId)),
    combine: queries => ({
      data: queries.map(query => query.data).filter(isExpandedBlockDetail),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

const isExpandedBlockDetail = (block: unknown): block is ExpandedBlockDetail => {
  return Boolean(block)
}

export const useTransaction = (transactionId: TransactionId) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(transactionQueryOptions(activeNetwork.name, transactionId))
}

export const useTransactionReceipt = (transactionId: TransactionId) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    ...transactionReceiptQueryOptions(activeNetwork.name, transactionId),
    refetchInterval: query => (query.state.data ? false : 3000),
  })
}

export const useVnsName = (address: AddressString) => {
  const { activeNetwork } = useSettingsStore()

  return useQuery(vnsNameQueryOptions(activeNetwork.name, address))
}
