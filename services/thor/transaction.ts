import type { ThorClient } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import { type HexString, transactionReceiptSchema, transactionSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'

export const transactionQueryOptions = (
  thorClient: ThorClient,
  networkName: NetworkName,
  transactionId: HexString,
) => ({
  queryKey: [getTransaction.name, networkName, transactionId],
  queryFn: () => getTransaction({ thorClient, transactionId }),
  staleTime: Infinity,
})

export const transactionReceiptQueryOptions = (
  thorClient: ThorClient,
  networkName: NetworkName,
  transactionId: HexString,
) => ({
  queryKey: [getTransactionReceipt.name, networkName, transactionId],
  queryFn: () => getTransactionReceipt({ thorClient, transactionId }),
})

export const getTransaction = async ({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: HexString
}) => {
  const tx = await thorClient.transactions.getTransaction(transactionId)

  if (!tx) return null

  return zodParse({
    data: tx,
    schema: transactionSchema,
    errorMessage: 'Failed to parse Thor transaction',
  })
}

const getTransactionReceipt = async ({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: HexString
}) => {
  const receipt = await thorClient.transactions.getTransactionReceipt(transactionId)

  if (!receipt) return null

  return zodParse({
    data: receipt,
    schema: transactionReceiptSchema,
    errorMessage: 'Failed to parse Thor transaction receipt',
  })
}
