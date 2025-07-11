import { useQuery } from "@tanstack/react-query"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"

const BLOCK_TIME = 10 * 1000 // 10 seconds

export function useBestBlock() {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, Revision.BEST.toString()],
    queryFn: () => getBlock({ thorClient, revision: Revision.BEST }),
    refetchInterval: BLOCK_TIME,
    staleTime: BLOCK_TIME,
  })
}
