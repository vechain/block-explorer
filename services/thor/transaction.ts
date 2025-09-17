import type { NetworkName } from '@/lib/constants/network'
import { type TransactionId, transactionReceiptSchema, transactionSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { getThorClient } from './client'

export const transactionQueryOptions = (networkName: NetworkName, transactionId: TransactionId) => ({
  queryKey: [getTransaction.name, networkName, transactionId],
  queryFn: () => getTransaction({ networkName, transactionId }),
  staleTime: Infinity,
})

export const transactionReceiptQueryOptions = (networkName: NetworkName, transactionId: TransactionId) => ({
  queryKey: [getTransactionReceipt.name, networkName, transactionId],
  queryFn: () => getTransactionReceipt({ networkName, transactionId }),
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
