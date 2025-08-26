import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
import { getTransfers } from "./actions"
import { GetTransfersParams } from "./schemas"

export const useAccountTransfers = ({ params }: { params: GetTransfersParams }) => {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getTransfers.name, activeNetwork.name, params],
    queryFn: () => getTransfers({ network: activeNetwork.name, params }),
  })
}
