import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { totalVthoClaimedSchema } from "./schemas"

export async function getTotalVthoClaimed({ network }: { network: NetworkName }) {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/total-vtho-claimed", network })
  return totalVthoClaimedSchema.parse(response)
}
