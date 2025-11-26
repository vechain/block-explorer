import { queryOptions, skipToken } from '@tanstack/react-query'
import z from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { type TransactionId, transactionReceiptSchema, transactionSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

/**
 * Transaction
 */
export const transactionQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [getTransaction.name, networkName, transactionId],
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
    fallbackData: null,
  })
}

/**
 * Transaction receipt
 */
export const transactionReceiptQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [getTransactionReceipt.name, networkName, transactionId],
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
    fallbackData: null,
  })
}

export const legacyBaseFeePerGasQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [getLegacyBaseGasPrice.name, networkName],
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
    fallbackData: BigInt(0),
  })
}
