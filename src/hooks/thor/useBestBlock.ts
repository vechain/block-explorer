import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/hooks/useThorClient"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"

export function useBestBlock() {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, Revision.BEST.toString()],
    queryFn: () => getBlock({ thorClient, revision: Revision.BEST }),
    refetchInterval: 3000, // Poll every 3 seconds
  })
}
