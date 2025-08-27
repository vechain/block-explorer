import { AddressString } from "@/schemas"
import { useThorClient } from "@/services/thor/thor-client"
import { useQueries } from "@tanstack/react-query"
import { getVip180, Vip180 } from "./actions"

export const useVip180List = (addresses: AddressString[]) => {
  const { activeNetwork, thorClient } = useThorClient()

  return useQueries({
    queries: addresses.map(address => ({
      queryKey: [getVip180.name, activeNetwork.name, address],
      queryFn: () => getVip180(thorClient, address),
      select: (data: Vip180 | null) => ({ address, vip180: data }),
    })),
    combine: queries =>
      queries.reduce((acc, query) => {
        if (query.data) {
          const { address, vip180 } = query.data
          acc[address] = vip180
        }
        return acc
      }, {} as Vip180List),
  })
}

type Vip180List = Record<AddressString, Vip180 | null>
