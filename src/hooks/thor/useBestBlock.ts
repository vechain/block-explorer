import { useQuery } from "@tanstack/react-query"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"

export function useBestBlock() {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, Revision.BEST.toString()],
    queryFn: () => getBlock({ thorClient, revision: Revision.BEST }),
    staleTime: 10000,
  })
}
