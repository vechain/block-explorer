import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { nftHoldersSchema } from "./schemas"

export const getNftHolders = async ({ network }: { network: NetworkName }) => {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/nft-holders", network })
  return nftHoldersSchema.parse(response)
}
