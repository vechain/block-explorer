import { useQuery, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { AddressString, BlockId, BlockRevision, TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { accountQueryOptions } from './account'
import { baseFeePerGasQueryOptions, bestBlockCompressedQueryOptions, blockExpandedQueryOptions } from './block'
import { legacyBaseFeePerGasQueryOptions, transactionQueryOptions, transactionReceiptQueryOptions } from './transaction'
import { vnsNameQueryOptions } from './vns'

/**
 * Block hooks
 */
export const useBestBlockCompressed = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(bestBlockCompressedQueryOptions(activeNetwork.name))
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

export const useMultipleAccounts = (addresses: AddressString[]) => {
  const { activeNetwork } = useSettingsStore()

  const queries = useMemo(
    () => addresses.map(address => accountQueryOptions(activeNetwork.name, address)),
    [activeNetwork.name, addresses],
  )

  const results = useQueries({
    queries,
    combine: queryResults => ({
      data: new Map(
        queryResults
          .map((result, index) => [addresses[index], result.data] as const)
          .filter((entry): entry is [AddressString, NonNullable<(typeof entry)[1]>] => entry[1] != null),
      ),
      isPending: queryResults.some(result => result.isPending),
    }),
  })

  return results
}
