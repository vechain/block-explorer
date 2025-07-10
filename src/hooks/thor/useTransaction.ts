import { useQuery } from "@tanstack/react-query"
import { getTransaction } from "@/actions/getTransaction"
import { Hex } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"

export function useTransaction(transactionId: Hex) {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getTransaction.name, transactionId.toString()],
    queryFn: () => getTransaction({ thorClient, transactionId }),
    staleTime: Infinity,
  })
}
