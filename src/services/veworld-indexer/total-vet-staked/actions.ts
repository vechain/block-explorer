import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { totalVetStakedSchema } from "./schemas"

export const getTotalVetStaked = async ({ network }: { network: NetworkName }) => {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/total-vet-staked", network })
  return totalVetStakedSchema.parse(response)
}
