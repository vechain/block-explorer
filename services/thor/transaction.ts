import type { Hex } from '@vechain/sdk-core'
import type { ThorClient, TransactionDetailNoRaw } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'

/**
 * TODO: fix this transaction detail typing when the SDK is updated.
 * Currently, there is no disctinction between dynamic fee and legacy transactions.
 * for instance, "type" is not in TransactionDetailNoRaw.
 * The verbosity in type definition is not ideal, but it's the best we can do for now.
 */

export type BaseTransaction = {
  id: TransactionDetailNoRaw['id']
  origin: TransactionDetailNoRaw['origin']
  gasPayer: TransactionDetailNoRaw['gasPayer']
  size: TransactionDetailNoRaw['size']
  meta: TransactionDetailNoRaw['meta']
  chainTag: TransactionDetailNoRaw['chainTag']
  blockRef: TransactionDetailNoRaw['blockRef']
  expiration: TransactionDetailNoRaw['expiration']
  clauses: TransactionDetailNoRaw['clauses']
  gas: TransactionDetailNoRaw['gas']
  dependsOn: TransactionDetailNoRaw['dependsOn']
  nonce: TransactionDetailNoRaw['nonce']
  reserved: TransactionDetailNoRaw['reserved']
}

type DynamicFeeTransactionFields = {
  type: 81
  maxFeePerGas: Required<TransactionDetailNoRaw>['maxFeePerGas']
  maxPriorityFeePerGas: Required<TransactionDetailNoRaw>['maxPriorityFeePerGas']
}

type LegacyTransactionFields = {
  type: 0
  gasPriceCoef: Required<TransactionDetailNoRaw>['gasPriceCoef']
}

export type DynamicFeeTransaction = BaseTransaction & DynamicFeeTransactionFields
export type LegacyTransaction = BaseTransaction & LegacyTransactionFields

export type TransactionDetail = DynamicFeeTransaction | LegacyTransaction

export const transactionQueryOptions = (thorClient: ThorClient, networkName: NetworkName, transactionId: Hex) => ({
  queryKey: [getTransaction.name, networkName, transactionId.toString()],
  queryFn: () => getTransaction({ thorClient, transactionId }),
  staleTime: Infinity,
})

export const transactionReceiptQueryOptions = (
  thorClient: ThorClient,
  networkName: NetworkName,
  transactionId: Hex,
) => ({
  queryKey: [getTransactionReceipt.name, networkName, transactionId.toString()],
  queryFn: () => getTransactionReceipt({ thorClient, transactionId }),
})

export const getTransaction = async ({ thorClient, transactionId }: { thorClient: ThorClient; transactionId: Hex }) => {
  const tx = await thorClient.transactions.getTransaction(transactionId.toString())

  if (!tx) return null

  return tx as TransactionDetail
}

const getTransactionReceipt = async ({ thorClient, transactionId }: { thorClient: ThorClient; transactionId: Hex }) => {
  const receipt = await thorClient.transactions.getTransactionReceipt(transactionId.toString())

  if (!receipt) return null

  return receipt
}
