import { useQuery } from "@tanstack/react-query"
import { getAccount } from "@/actions/getAccount"
import { Address } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"

export function useAccount(address: Address) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getAccount.name, address.toString(), activeNetwork.name],
    queryFn: () => getAccount({ thorClient, address }),
    staleTime: Infinity,
  })
}
