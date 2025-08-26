import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
import { getTransactions } from "./actions"
import { GetTransactionsParams } from "./schemas"

export const useAccountTransactions = ({ params }: { params: GetTransactionsParams }) => {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getTransactions.name, activeNetwork.name, params],
    queryFn: () => getTransactions({ network: activeNetwork.name, params }),
  })
}
