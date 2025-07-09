import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/hooks/useThorClient"
import { getTransaction } from "@/actions/getTransaction"
import { Hex } from "@vechain/sdk-core"

export function useTransaction(transactionId: Hex) {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getTransaction.name, transactionId.toString()],
    queryFn: () => getTransaction({ thorClient, transactionId }),
  })
}
