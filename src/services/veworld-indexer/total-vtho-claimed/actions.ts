import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { totalVthoClaimedSchema } from "./schemas"
import { zodParse } from "@/utils/zod"

export const getTotalVthoClaimed = async ({ network }: { network: NetworkName }) => {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/total-vtho-claimed", network })
  return zodParse(response, totalVthoClaimedSchema, "Invalid total vtho claimed response from VeWorld Indexer")
}
