import { VStack } from "@chakra-ui/react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { BlockSummary } from "@/components/blocks/BlockSummary.tsx"
import { useLatestBlocks } from "@/hooks/thor/useLatestBlocks"
import { GetBlockReturnType } from "@/actions/getBlock"

function isExpandedBlockDetail(block: GetBlockReturnType | undefined): block is ExpandedBlockDetail {
  return Boolean(block)
}

export const LatestBlocks = ({ count }: { count: number }) => {
  const queries = useLatestBlocks({ count })

  const blocks = queries.map(query => query.data).filter(isExpandedBlockDetail)

  return (
    <VStack>
      {blocks.map(block => (
        <BlockSummary key={block.id} block={block} />
      ))}
    </VStack>
  )
}
