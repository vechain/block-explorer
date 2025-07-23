import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
import { getTransactions, type GetAccountTransactionsParams } from "./actions"

export function useAccountTransactions({ params }: { params: GetAccountTransactionsParams }) {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getTransactions.name, activeNetwork.name, params],
    queryFn: () => getTransactions({ network: activeNetwork.name, params }),
  })
}
