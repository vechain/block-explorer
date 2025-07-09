import { Revision } from "@vechain/sdk-core"
import { ExpandedBlockDetail, ThorClient } from "@vechain/sdk-network"

export type GetBlockReturnType = ExpandedBlockDetail | null

export async function getBlock({
  thorClient,
  revision,
}: {
  thorClient: ThorClient
  revision: Revision
}): Promise<GetBlockReturnType> {
  const block = await thorClient.blocks.getBlockExpanded(revision.toString())

  return block
}
