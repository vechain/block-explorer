import { Hex } from "@vechain/sdk-core"
import { ThorClient, TransactionDetailNoRaw } from "@vechain/sdk-network"

export type GetTransactionReturnType = TransactionDetailNoRaw | null

export async function getTransaction({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: Hex
}): Promise<GetTransactionReturnType> {
  const tx = await thorClient.transactions.getTransaction(transactionId.toString())

  return tx
}
