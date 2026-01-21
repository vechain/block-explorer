import { useQuery } from '@tanstack/react-query'
import type { AddressString, BlockId, BlockRevision, Transaction, TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { accountQueryOptions } from './account'
import { baseFeePerGasQueryOptions, bestBlockCompressedQueryOptions, blockExpandedQueryOptions } from './block'
import { accountStakedVetQueryOptions } from './staked-vet'
import {
  legacyBaseFeePerGasQueryOptions,
  revertReasonQueryOptions,
  transactionQueryOptions,
  transactionReceiptQueryOptions,
} from './transaction'
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

export const useRevertReason = (transaction: Transaction | null | undefined, isReverted: boolean) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(revertReasonQueryOptions(activeNetwork.name, transaction, isReverted))
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

export const useAccountStakedVet = (address: AddressString | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountStakedVetQueryOptions(activeNetwork.name, address))
}
