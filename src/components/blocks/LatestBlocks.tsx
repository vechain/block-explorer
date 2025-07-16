import { VStack } from "@chakra-ui/react"

import { BlockSummary } from "@/components/blocks/BlockSummary.tsx"
import { useLatestBlocks } from "@/hooks/thor/useLatestBlocks"

export const LatestBlocks = ({ count }: { count: number }) => {
  const { data: latestBlocks, isPending } = useLatestBlocks({ count })

  if (isPending) {
    return <div>Loading...</div>
  }

  return (
    <VStack>
      {latestBlocks.map(block => (
        <BlockSummary key={block.id} block={block} />
      ))}
    </VStack>
  )
}
