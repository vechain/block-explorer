import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { TRANSACTION_CACHE_KEY } from "@/constants/QueryKeys.ts"
import { TransactionDetailNoRaw } from "@vechain/sdk-network"

type UseTransactionQuery = {
  getTransaction: (txId: string) => Promise<TransactionDetailNoRaw | null>
}

export const useTransactionQuery = (): UseTransactionQuery => {
  const { thorClient } = useNetwork()
  const queryClient = useQueryClient()

  const getTransaction = useCallback(
    async (txId: string): Promise<TransactionDetailNoRaw | null> => {
      let tx: TransactionDetailNoRaw | null = null

      const cachedTx = queryClient.getQueryData([TRANSACTION_CACHE_KEY, txId])
      if (cachedTx) return cachedTx as TransactionDetailNoRaw

      tx = await thorClient.transactions.getTransaction(txId)
      if (!tx) return null

      queryClient.setQueryData([TRANSACTION_CACHE_KEY, txId], tx)

      return tx
    },
    [thorClient, queryClient],
  )

  return {
    getTransaction,
  }
}
