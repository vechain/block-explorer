import { useQuery } from "@tanstack/react-query"
import { Address } from "@vechain/sdk-core"
import { getAccount } from "./account"
import { useThorClient } from "../thor-client"

export function useAccount(address: Address) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getAccount.name, address.toString(), activeNetwork.name],
    queryFn: () => getAccount({ thorClient, address }),
    staleTime: Infinity,
  })
}
