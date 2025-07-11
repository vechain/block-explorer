import { GetBlockReturnType } from "@/actions/getBlock"
import { ExpandedBlockDetail } from "@vechain/sdk-network"

export function isExpandedBlockDetail(block: GetBlockReturnType | undefined): block is ExpandedBlockDetail {
  return Boolean(block)
}
