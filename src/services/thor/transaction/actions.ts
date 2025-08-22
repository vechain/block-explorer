import { Hex } from "@vechain/sdk-core"
import { ThorClient, TransactionDetailNoRaw, TransactionReceipt } from "@vechain/sdk-network"

/**
 * TODO: fix this transaction detail typing when the SDK is updated.
 * Currently, there is no disctinction between dynamic fee and legacy transactions.
 * for instance, "type" is not in TransactionDetailNoRaw.
 * The verbosity in type definition is not ideal, but it's the best we can do for now.
 */

export type BaseTransaction = {
  id: TransactionDetailNoRaw["id"]
  origin: TransactionDetailNoRaw["origin"]
  gasPayer: TransactionDetailNoRaw["gasPayer"]
  size: TransactionDetailNoRaw["size"]
  meta: TransactionDetailNoRaw["meta"]
  chainTag: TransactionDetailNoRaw["chainTag"]
  blockRef: TransactionDetailNoRaw["blockRef"]
  expiration: TransactionDetailNoRaw["expiration"]
  clauses: TransactionDetailNoRaw["clauses"]
  gas: TransactionDetailNoRaw["gas"]
  dependsOn: TransactionDetailNoRaw["dependsOn"]
  nonce: TransactionDetailNoRaw["nonce"]
  reserved: TransactionDetailNoRaw["reserved"]
}

type DynamicFeeTransactionFields = {
  type: 81
  maxFeePerGas: Required<TransactionDetailNoRaw>["maxFeePerGas"]
  maxPriorityFeePerGas: Required<TransactionDetailNoRaw>["maxPriorityFeePerGas"]
}

type LegacyTransactionFields = {
  type: 0
  gasPriceCoef: Required<TransactionDetailNoRaw>["gasPriceCoef"]
}

export type DynamicFeeTransaction = BaseTransaction & DynamicFeeTransactionFields
export type LegacyTransaction = BaseTransaction & LegacyTransactionFields

export type TransactionDetail = DynamicFeeTransaction | LegacyTransaction

export const getTransaction = async ({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: Hex
}): Promise<TransactionDetail | null> => {
  const tx = await thorClient.transactions.getTransaction(transactionId.toString())

  return tx as TransactionDetail
}

export const getTransactionReceipt = async ({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: Hex
}): Promise<TransactionReceipt | null> => {
  const receipt = await thorClient.transactions.getTransactionReceipt(transactionId.toString())

  return receipt
}
