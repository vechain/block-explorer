import { useQuery } from "@tanstack/react-query"
import { Hex } from "@vechain/sdk-core"
import { useThorClient } from "../thor-client"
import { getTransaction } from "./actions"

export function useTransaction(transactionId: Hex) {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getTransaction.name, transactionId.toString()],
    queryFn: () => getTransaction({ thorClient, transactionId }),
    staleTime: Infinity,
  })
}
