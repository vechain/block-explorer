import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"
import { nftHoldersSchema } from "./schemas"

export async function getNftHolders({ network }: { network: NetworkName }) {
  const response = await veWorldIndexer.get({ endPoint: "/stargate/nft-holders", network })
  return nftHoldersSchema.parse(response)
}
