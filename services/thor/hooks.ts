import { useQueries, useQuery } from '@tanstack/react-query'
import type { AddressString, BlockId, BlockRevision, CompressedBlock, TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { accountQueryOptions } from './account'
import {
  baseFeePerGasQueryOptions,
  bestBlockCompressedQueryOptions,
  blockCompressedQueryOptions,
  blockExpandedQueryOptions,
} from './block'
import { legacyBaseFeePerGasQueryOptions, transactionQueryOptions, transactionReceiptQueryOptions } from './transaction'
import { vnsNameQueryOptions } from './vns'

/**
 * Block hooks
 */
export const useBestBlockCompressed = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))
}

export const useLatestBlocksCompressed = ({ count }: { count: number }) => {
  const { activeNetwork } = useSettingsStore()
  const { data: bestBlock } = useBestBlockCompressed()

  const bestBlockNumber = bestBlock?.number ?? count

  const queries = []

  for (let i = 0; i < count; i++) {
    const revision = bestBlockNumber - i
    if (revision > 0) {
      queries.push(blockCompressedQueryOptions({ networkName: activeNetwork.name, revision }))
    }
  }

  return useQueries({
    queries,
    combine: queries => ({
      data: queries.map(query => query.data).filter(isCompressedBlock),
      isLoading: queries.every(query => query.isLoading),
      isPending: queries.every(query => query.isPending),
    }),
  })
}

const isCompressedBlock = (block: unknown): block is CompressedBlock => {
  return Boolean(block)
}
export const useBlockExpanded = (revision: BlockRevision | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockExpandedQueryOptions(activeNetwork.name, revision))
}

/**
 * Transaction hooks
 */
export const useTransaction = (transactionId: TransactionId | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(transactionQueryOptions(activeNetwork.name, transactionId))
}

export const useTransactionReceipt = (transactionId: TransactionId | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(transactionReceiptQueryOptions(activeNetwork.name, transactionId))
}

export const useBaseFeePerGas = (blockId: BlockId | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(baseFeePerGasQueryOptions(activeNetwork.name, blockId))
}

export const useLegacyBaseFeePerGas = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(legacyBaseFeePerGasQueryOptions(activeNetwork.name))
}

/**
 * Account hooks
 */
export const useVnsName = (address: AddressString | undefined) => {
  const { activeNetwork } = useSettingsStore()

  return useQuery(vnsNameQueryOptions(activeNetwork.name, address))
}

export const useAccount = (address: AddressString | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountQueryOptions(activeNetwork.name, address))
}
