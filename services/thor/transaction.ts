import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { Revision } from '@vechain/sdk-core'
import z from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { type Transaction, type TransactionId, transactionReceiptSchema, transactionSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getPossibleSelectorMismatch, type PossibleSelectorMismatch } from '@/lib/transaction-failure-insights'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

const TRANSACTION_QUERY_KEY = 'getTransaction'
const TRANSACTION_RECEIPT_QUERY_KEY = 'getTransactionReceipt'
const LEGACY_BASE_GAS_PRICE_QUERY_KEY = 'getLegacyBaseGasPrice'
const TRANSACTION_FAILURE_INSIGHT_QUERY_KEY = 'getTransactionFailureInsight'

type TransactionFailureInsight = {
  revertReason: string | null
  possibleSelectorMismatch: PossibleSelectorMismatch | null
}

export const transactionQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [TRANSACTION_QUERY_KEY, networkName, transactionId],
    queryFn: transactionId ? () => getTransaction({ networkName, transactionId }) : skipToken,
    staleTime: Infinity,
  })

export const getTransaction = async ({
  networkName,
  transactionId,
}: {
  networkName: NetworkName
  transactionId: TransactionId
}) => {
  const thorClient = getThorClient(networkName)
  const tx = await thorClient.transactions.getTransaction(transactionId)

  if (!tx) return null

  return zodParse({
    data: tx,
    schema: transactionSchema,
    errorMessage: 'Failed to parse Thor transaction',
  })
}

/**
 * Transaction receipt
 */
export const transactionReceiptQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [TRANSACTION_RECEIPT_QUERY_KEY, networkName, transactionId],
    queryFn: transactionId ? () => getTransactionReceipt({ networkName, transactionId }) : skipToken,
    refetchInterval: query => (query.state.data === null ? false : 3000),
  })

const getTransactionReceipt = async ({
  networkName,
  transactionId,
}: {
  networkName: NetworkName
  transactionId: TransactionId
}) => {
  const thorClient = getThorClient(networkName)
  const receipt = await thorClient.transactions.getTransactionReceipt(transactionId)

  if (!receipt) return null

  return zodParse({
    data: receipt,
    schema: transactionReceiptSchema,
    errorMessage: 'Failed to parse Thor transaction receipt',
  })
}

const legacyBaseFeePerGasQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [LEGACY_BASE_GAS_PRICE_QUERY_KEY, networkName],
    queryFn: () => getLegacyBaseGasPrice({ networkName }),
  })

const getLegacyBaseGasPrice = async ({ networkName }: { networkName: NetworkName }) => {
  const thorClient = getThorClient(networkName)
  const legacyBaseGasPrice = await thorClient.transactions.getLegacyBaseGasPrice()

  if (!legacyBaseGasPrice.success) return null

  return zodParse({
    data: legacyBaseGasPrice.result.plain,
    schema: z.coerce.bigint(),
    errorMessage: 'Failed to parse legacy base gas price',
  })
}

/**
 * Revert reason - simulates the transaction to get the revert reason
 */
const transactionFailureInsightQueryOptions = (
  networkName: NetworkName,
  transaction: Transaction | null | undefined,
  isReverted: boolean,
) =>
  queryOptions({
    queryKey: [TRANSACTION_FAILURE_INSIGHT_QUERY_KEY, networkName, transaction?.id],
    queryFn: transaction && isReverted ? () => getTransactionFailureInsight({ networkName, transaction }) : skipToken,
    staleTime: Infinity,
  })

const getTransactionFailureInsight = async ({
  networkName,
  transaction,
}: {
  networkName: NetworkName
  transaction: Transaction
}): Promise<TransactionFailureInsight> => {
  const thorClient = getThorClient(networkName)
  const clauses = transaction.clauses.map(clause => ({
    to: clause.to ?? null,
    value: clause.value.toString(),
    data: clause.data,
  }))

  const simulations = await thorClient.transactions.simulateTransaction(clauses, {
    revision: Revision.of(transaction.meta.blockID),
    caller: transaction.origin,
    gas: Number(transaction.gas),
  })

  const possibleSelectorMismatch = getPossibleSelectorMismatch({
    transaction,
    simulations,
  })

  for (const simulation of simulations) {
    if (simulation.reverted && simulation.data && simulation.data !== '0x') {
      const decoded = thorClient.transactions.decodeRevertReason(simulation.data)
      if (decoded) {
        return {
          revertReason: decoded,
          possibleSelectorMismatch,
        }
      }
    }

    if (simulation.reverted && simulation.vmError) {
      return {
        revertReason: simulation.vmError,
        possibleSelectorMismatch,
      }
    }
  }

  return {
    revertReason: null,
    possibleSelectorMismatch,
  }
}

export const useTransaction = (transactionId: TransactionId | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionQueryOptions(networkName ?? activeNetworkName, transactionId))
}

export const useTransactionReceipt = (transactionId: TransactionId | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionReceiptQueryOptions(networkName ?? activeNetworkName, transactionId))
}

export const useTransactionFailureInsight = (
  transaction: Transaction | null | undefined,
  isReverted: boolean,
  networkName?: NetworkName,
) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionFailureInsightQueryOptions(networkName ?? activeNetworkName, transaction, isReverted))
}

export const useLegacyBaseFeePerGas = (networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(legacyBaseFeePerGasQueryOptions(networkName ?? activeNetworkName))
}
