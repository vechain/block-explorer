import { VStack } from "@chakra-ui/react"
import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { BlockSummary } from "@/components/blocks/BlockSummary.tsx"

export const LatestBlocks = ({ count }: { count: number }) => {
  const blocks = useLatestBlocks({ count })

  return (
    <VStack>
      {blocks.blocks.map((b, i) => (
        <BlockSummary block={b} key={`block-${i}`} />
      ))}
    </VStack>
  )
}
