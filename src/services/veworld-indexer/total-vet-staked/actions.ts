import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { totalVetStakedSchema } from "./schemas"
import { zodParse } from "@/utils/zod"

export const getTotalVetStaked = async ({ network }: { network: NetworkName }) => {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/total-vet-staked", network })
  return zodParse(response, totalVetStakedSchema, "Invalid total vet staked response from VeWorld Indexer")
}
