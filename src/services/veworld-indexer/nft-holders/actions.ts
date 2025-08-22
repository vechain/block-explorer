import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { nftHoldersSchema } from "./schemas"
import { zodParse } from "@/utils/zod"

export const getNftHolders = async ({ network }: { network: NetworkName }) => {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/nft-holders", network })

  return zodParse(response, nftHoldersSchema, "Invalid nft holders response from VeWorld Indexer")
}
