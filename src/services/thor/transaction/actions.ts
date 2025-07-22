import { Hex } from "@vechain/sdk-core"
import { ThorClient, TransactionDetailNoRaw } from "@vechain/sdk-network"

export async function getTransaction({
  thorClient,
  transactionId,
}: {
  thorClient: ThorClient
  transactionId: Hex
}): Promise<TransactionDetailNoRaw | null> {
  const tx = await thorClient.transactions.getTransaction(transactionId.toString())

  return tx
}
