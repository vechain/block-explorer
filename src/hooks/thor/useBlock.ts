import { useQuery } from "@tanstack/react-query"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"

export function useBlock(revision: Revision) {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, revision.toString()],
    queryFn: () => getBlock({ thorClient, revision }),
  })
}
